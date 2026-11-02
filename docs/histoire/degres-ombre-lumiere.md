# Les degrés cachés d'Ombre et de Lumière

Feuille de route, point 4 ★ (31/10) : « la jauge affinée en degrés invisibles qui pèsent sur les choix offerts ».

★ = dit ou validé par le joueur · ☆ = proposition de Claude, à valider. Les questions ouvertes sont à la fin (D1 à D10).

Ce qui est validé, et que la proposition respecte :
- ★ Q113 (29/10) : il faut des degrés d'Ombre et de Lumière pour mesurer à quel point le joueur a choisi son camp, et ils pèsent sur les choix proposés. Le joueur neutre ne peut plus agir une fois arrivé à un point de non-retour ; il peut agir légèrement, mais jamais influencer lui-même le cours de l'histoire.
- ★ Q138 (31/10) : les degrés restent cachés au joueur, pour plus de surprise.
- ★ La jauge visible (16/10 et 19/10) : le barème, la zone neutre de −25 à +25 en dégradé, les trois paliers (25, 60, 90), le frein, le Carrefour à 60, le serment ×1,5, le parjure, le livre des deux voies, les ☀ / ☾ sur les boutons avec 40 % de flair. Rien de cela ne change.
- ★ Le camp se scelle à la 8e et dernière pièce d'armure (29/10) : le serment l'emporte ; sans serment, dans la zone neutre, c'est la fin neutre ; sinon, le côté où l'on penche (le tableau des quatre cas du 16/10).
- ★ La Faucheuse a sa jauge à part, la Mort (16/10) : les degrés ne mesurent pas la relation avec elle.
- ★ Garrick change complètement selon le camp (16/10) ; il cesse de parler au joueur de Lumière quand celui-ci rencontre le Grand Sage.
- ★ Le joueur trop sombre n'a plus accès aux villes de la Lumière et déménage à Cendrebourg (fins.md, voie de l'Ombre).
- ★ Lumière cruelle (L4) : la Lumière suivie aveuglément, et les pires atrocités. ☆ fins.md proposait déjà « un compteur caché des actes les plus graves » : il devient ici les actes graves.

---

## 1. L'idée : deux mesures, qui vont en sens inverse ☆

| | **La jauge** ★ (elle existe) | **Les degrés** ☆ (nouveaux) |
|---|---|---|
| Ce qu'elle dit | ce que **le monde** pense de toi (le commentaire du code le dit déjà) | ce que **JeuneGoy** est devenu, à quel point il a choisi |
| Visible ? | oui : le HUD, le livre des deux voies, la gazette des paliers | **jamais** : ni chiffre, ni nom, ni pictogramme ; seulement des indices dans le monde |
| S'éloigner du centre | freiné (×1, ×0,4, ×0,25) ★ | presque libre au début, puis de plus en plus lent (l'élan) |
| Revenir vers le centre | compte en entier : on peut se racheter ★ | **de plus en plus dur** : l'inertie |
| Points de non-retour | le sceau seulement ★ | le sceau, l'ancrage, les actes graves, le serment, et le non-retour du neutre |
| Ce qui la nourrit | le barème ★ | le même barème, pesé autrement, plus des choix que la jauge ne voit pas (le Parrain, la Main Noire, le sabotage, le Carrefour refusé…) |

Le monde oublie vite ; l'âme, non. Un marchand peut redorer sa réputation en un mois ; il ne redevient pas pour autant celui qu'il était avant d'avoir livré six recherchés à la garde.

Les deux mesures disent presque toujours la même chose (la simulation le vérifie : quand le degré n'est pas neutre et que la jauge est sortie de la zone neutre, elles sont du même côté dans 100 % des relevés, 92 % pour un neutre verrouillé). Elles divergent dans les cas qui comptent : le joueur qui « fait du chiffre » chez la Confrérie sans y croire (jauge haute, degré tiède), le repenti (jauge revenue au centre, degré encore marqué), le neutre qui ménage les deux camps (jauge dans la zone, degré neutre qui s'enkyste).

---

## 2. Les sept degrés ☆

Les noms sont des noms de travail, pour le code et pour nous. Le joueur ne les lit jamais.

| Degré | Nom (interne) | On y entre à (engagement) | On en sort sous | Qui est là |
|---|---|---|---|---|
| +3 | **Lumière ardente** | +65, et seulement avec le serment à la Confrérie, ou 4 actes graves de Lumière de plus que d'Ombre | +59 | le zélé : il croit sans réserve, il dénonce, il ne voit plus les fissures |
| +2 | **Lumière** | +35 | +29 | le fidèle de la Confrérie, le Sage de plus en plus près ★ |
| +1 | **Lumière tiède** | +12 | +6 | celui qui penche, par habitude ou par intérêt, sans avoir choisi |
| 0 | **Neutre** | entre les deux | | celui qui n'a pas choisi (ou qui ne choisira plus) |
| −1 | **Ombre tiède** | −12 | −6 | celui qui rend service aux Bannis sans se mouiller |
| −2 | **Ombre** | −35 | −29 | l'ami des Bannis, Garrick de plus en plus présent ★ |
| −3 | **Ombre profonde** | −65, et seulement avec le serment aux Bannis, ou 4 actes graves d'Ombre de plus que de Lumière | −59 | celui qui a franchi des lignes : il cache, il piège, il a baisé la bague |

- L'**engagement** va de −100 (l'Ombre) à +100 (la Lumière).
- L'écart entre l'entrée et la sortie (6 points, l'hystérésis) évite qu'un degré clignote d'un jour à l'autre.
- Le dernier degré ne s'atteint pas par le seul volume : on ne devient pas ardent en vendant des cordes aux missions de la Confrérie. Sans serment ni actes graves, l'engagement plafonne juste sous le seuil (+64 ou −64). Et le zèle est constant : celui qui dénonce un jour et cache le lendemain n'est pas ardent (on compte les actes graves d'un côté moins ceux de l'autre).

---

## 3. Ce qui les fait bouger ☆

### 3.1 Les gestes du barème (du plus petit au plus gros, comme le barème ★)

Chaque geste du barème compte déjà dans la jauge. Il compte aussi dans les degrés, avec un poids qui dit **ce qu'il engage**, pas ce qu'en dit le monde.

| Geste ★ (côté) | Jauge ★ | Degrés ☆ | Acte grave ☆ | Pourquoi ce poids |
|---|---|---|---|---|
| Donner au mendiant, une fois par jour (☀) | +1 | 0,5 | | un geste de bonté, pas un choix de camp |
| Dédommager généreusement (☀) | +1 | 0,5 | | idem |
| Soigner sans faire payer (☀) | +1 | 1 | | |
| Aider quelqu'un sur la route du grand voyage (☀) | +1 | 1 | | |
| Une décoration de lumière (☀) | +2 | 1 | | on affiche ses couleurs, sans rien risquer |
| Mission réussie en terre de lumière (☀) | +3 | 1 | | c'est du commerce : très fréquent, donc léger |
| Dénoncer un vrai recherché (☀) | +4 | **5** | **1** | on livre quelqu'un |
| Livrer la Main Noire (☀) | +4 | **8** | **2** | on livre une bande entière (et le chat avec, s'il le faut) |
| Offrir une âme à la Faucheuse (☾) | +1 | 1,5 | | la plupart des âmes « offertes » sont des envois sans chance, presque des accidents (la Mort a sa jauge à part ★) |
| Soudoyer le sergent de la Porte des Hommes (☾) | +1 | 1 | | |
| Faire payer un blessé sur la route (☾) | +1 | 2 | | |
| Une décoration d'ombre (☾) | +2 | 1 | | |
| Parier contre un aventurier (☾) | +2 | 2 | | |
| Une commande des Bannis (☾) | +2 | 2 | | |
| Un piège, un service de la Main Noire (☾) | +2 | 3 | | on trempe dans quelque chose |
| Mission réussie pour les Bannis (☾) | +3 | 1,5 | | du commerce, mais en terre interdite |
| Cacher un recherché (☾) | +4 | **5** | **1** | on protège un hors-la-loi, au risque de la garde |

- Le serment ne multiplie pas les gestes dans les degrés (il le fait déjà dans la jauge ★) : il compte une fois, à part (3.2).
- Un recherché caché puis livré à la garde : dans la jauge, l'ombre du geste s'efface ★. Dans les degrés, **les deux gestes restent** : on a caché, puis trahi. Ce n'est pas un retour au centre, c'est une âme qui se déchire (et deux actes graves, un de chaque côté).

### 3.2 Les choix que la jauge ne voit pas (lus chaque nuit dans la partie)

| Choix (il existe déjà dans le jeu) | Degrés ☆ |
|---|---|
| Prêter serment au Carrefour | ±10 de son côté |
| Rompre son serment (le parjure ★) | l'engagement est **coupé de moitié** : l'âme déchirée repart de plus près du centre |
| Le Parrain : baiser la bague | −10, et 2 actes graves d'Ombre |
| Le Parrain : se taire | −4 |
| Le Parrain : « le changer » | +3 |
| Le Parrain : le dénoncer | +10, et 2 actes graves de Lumière |
| Monter en grade dans la Main Noire (ou le Serpent) | −4 par grade |
| Se racheter auprès de la bande | +3 |
| La Faucheuse « éprise » (son dernier degré de séduction) | −5 |
| Une mission de sabotage réussie (une âme pure piégée pour elle) | −6, et 2 actes graves d'Ombre |
| Un palier du mécénat du Grand Sage | +3 |
| Un chantier de la Confrérie financé / un chantier du repaire | +3 / −3 |

### 3.3 La tiédeur : ne pas choisir finit aussi par compter

Le neutre a, lui aussi, son point de non-retour ★ (Q113). La **tiédeur** mesure ce que coûte de ne jamais choisir. Elle ne compte qu'à partir de l'époque du Carrefour (jour 30, ou la 3e pièce d'armure).

| Ce qui la fait monter | Tiédeur ☆ |
|---|---|
| Une nuit passée au degré neutre | +1 |
| Une journée à servir les deux camps | +0,5 |
| « Rester libre » au Carrefour | +12 |
| Le pacte de neutralité avec le Parrain | +10 |
| Un palier du prix de la neutralité (le mécénat des neutres) | +6 |

Ce qui la fait baisser : chaque point d'engagement gagné, d'un côté ou de l'autre, la ronge de moitié (on se réveille).

### 3.4 Ce qui ne compte pas

Les morts accidentelles (★ comme pour la jauge de la Mort), l'argent gagné, et la jauge elle-même : les degrés ne la recopient pas, ils lisent les mêmes gestes autrement.

### 3.5 Les choix qui existent et qu'il reste à brancher (après validation)

Garrick et ses soucis (lui prêter de l'argent, brûler ou lire la lettre de son passé) ; la réponse à un message de détresse (l'aigle du fauconnier du Conseil ou le corbeau de la Main Noire) ; dénoncer un innocent (le zèle : un acte grave de Lumière, qui nourrit L4) ; aider ou non Lucien Belhomme quand il dénonce Garrick ★ ; les dons à l'orphelinat de la Fleur du Pommier (l'hospitalité des Bannis ★ Q140 : un petit geste d'Ombre sans le savoir ?).

---

## 4. L'inertie ☆

Chaque geste est multiplié par un facteur qui dépend de là où l'on est :

| Engagement (en valeur absolue) | S'enfoncer dans son camp (l'élan) | Revenir vers le centre (l'inertie) |
|---|---|---|
| moins de 12 | ×1 | ×1 (jusqu'à 15) |
| 12 à 35 | ×0,6 | ×0,75 (de 15 à 40) |
| 35 à 65 | ×0,3 | ×0,5 (de 40 à 70) |
| au-delà | ×0,15 | ×0,35 |

- Le **centre attire ceux qui ne font rien** : une nuit sans aucun geste, sous 18 d'engagement, l'engagement s'effrite (×0,96). Un marchand distrait ne bascule pas par hasard ; un marchand engagé, si.
- Exemple ☆ : un joueur de Lumière ardente (engagement +80, jauge +80) se met à cacher des recherchés. Sa **jauge** revient dans la zone neutre après 14 recherchés cachés (revenir compte en entier ★). Son **degré**, lui, ne redevient neutre (sous +6) qu'après environ **26** recherchés cachés (5 × 0,35 jusqu'à 70, × 0,5 jusqu'à 40, × 0,75 jusqu'à 15, puis × 1) : deux fois plus. Et s'il est resté trois semaines ardent, l'ancrage (5) l'arrête de toute façon à Lumière tiède : le monde peut lui pardonner, il ne redevient pas celui qu'il était.
- L'élan, lui, ralentit l'ascension : il faut environ 50 dénonciations (ou des mois de missions) pour monter de 0 à +80. Les extrêmes se méritent, et les points de non-retour (5) font le reste.

---

## 5. Les points de non-retour ☆ (sauf le sceau ★)

| Point de non-retour | Ce qu'il faut | Ce qu'il fait |
|---|---|---|
| **Le sceau** ★ | la 8e pièce d'armure | le camp scellé tient le degré de son côté (Lumière : +1 au moins ; Ombre : −1 au plus) ; la fin neutre fixe le degré à neutre. Les degrés bougent encore, mais **dans** le camp : c'est ce qui décide des variantes de fin (6) |
| **Le serment** ★ (provisoire) | prêter serment au Carrefour | tant qu'il tient, le degré ne redescend pas sous ±1 ; le parjure ★ le libère |
| **L'ancrage** | 21 nuits de suite au dernier degré (±3) | on ne redevient jamais neutre (±1 au moins) |
| **Les actes graves** | 8 actes graves d'un côté, et l'âme de ce côté (des actes graves commis de l'autre côté attendent : le verrou se ferme le jour où l'on y passe) | de même |
| L'ancrage **et** les actes graves | les deux, du même côté | on ne redescend plus sous ±2 |
| **Le non-retour du neutre** (Q113 ★) | tiédeur 45, au moins 6 pièces d'armure, pas de serment, et le degré neutre | le degré reste neutre jusqu'à la fin |

Le non-retour du neutre, concrètement (☆, à valider) :
- **il peut agir légèrement** ★ : le mendiant, les soins, les décorations, les missions, les petits marchandages ; tout cela bouge encore la jauge (et un peu l'engagement, dans la zone neutre) ;
- **il ne peut plus influencer le cours de l'histoire** ★ : les grands choix ne lui sont plus offerts (6, le degré neutre) ; ils deviennent des choix passifs (« Laisser faire », « Ne rien dire », « Regarder ailleurs ») ;
- le seul vrai choix qui lui reste est celui de l'armure, quand le Sage vient la chercher au comptoir ★ (N1, N2, N3) ;
- le signe dans le monde : Garrick, à la 7e pièce ★, au lieu de « bientôt, ton camp sera scellé », lui dit en riant que c'est déjà fait (☆).

---

## 6. Ce que chaque degré change dans les choix offerts ☆ (à brancher après validation)

Principe : **rien n'est jamais affiché**. Un choix qui disparaît n'est pas grisé ni cadenassé ; il n'est simplement plus proposé, comme si JeuneGoy n'y pensait plus. Un choix qui apparaît arrive comme une occasion du monde (un visiteur, une lettre, une rumeur).

| Degré | Ce qui apparaît | Ce qui disparaît | Les événements | Les fins encore possibles |
|---|---|---|---|---|
| **+3 Lumière ardente** | le sergent de la garde te confie un registre (des recherchés te sont signalés, même des innocents) ; les missions « de purge » en terres des Bannis (elles nourrissent les actes graves, donc L4) ; Séraphine et Ilyriel te prennent sous leur aile plus tôt (L4 de revelations.md) | cacher un recherché ; le mot du marché noir ; les prêts de la Main Noire ; les commandes des Bannis ; l'option de **noter** une fissure du Sage (L5, L7 : la scène a lieu, mais JeuneGoy détourne le regard) | Garrick ne vient presque plus, et sa colère est plus marquée ★ ; le Sage te cite en exemple | L1, L4 (L2 et L3 demandent d'avoir encore des yeux : il faut redescendre à +2) |
| **+2 Lumière** | les commandes scellées du Conseil plus nombreuses ; la visite du Sage au comptoir plus tôt | Grand-mère Ortie se tait quand tu passes (L3 de revelations.md : en Lumière, la garde l'interrompt) | Garrick s'éloigne ★, puis ne parle plus après la rencontre avec le Sage ★ | L1, L2, L3 (et R, E en Lumière retournée) |
| **+1 Lumière tiède** | tout est offert | rien | Garrick tente encore, discrètement, de te ramener ★ ; c'est le degré naturel de la Lumière retournée (L2 : on a gardé de la réputation chez les Bannis ★) | L1, L2, L3, et les fins neutres si la jauge est dans la zone au sceau |
| **0 Neutre** | tout est offert… | … jusqu'au non-retour : alors le serment (le Carrefour ne revient plus, ni la dernière offre), dénoncer ou cacher un recherché (il passe, c'est tout), le Parrain (bague ou dénonciation), livrer la Main Noire, le paquet de Garrick, le sabotage de la Faucheuse | la Faucheuse se moque ★ ; Garrick blague ★ ; le Sage remercie pour les taxes ★ ; la Main Noire finit par disparaître ★ | N1, N2, N3 |
| **−1 Ombre tiède** | les Bannis viennent au comptoir (déjà au palier −1 de la jauge ★) | rien | Garrick se rapproche ★ ; le Drômmath ne te fait pas encore confiance : en Ombre, les jauges de préparation de guerre partent plus bas (O2, O3 plus probables) | O1 (difficile), O2, O3, les fins neutres, R, E |
| **−2 Ombre** | les confidences de Garrick ; le Drômmath ; les missions de guerre (saboter un relais du chant, une église ★ Q181) | la Confrérie ne t'ouvre plus son livre des dons | Garrick de plus en plus présent ★ | O1, O2, O3, R, E |
| **−3 Ombre profonde** | les gros contrats de la Main Noire ; les missions de guerre les plus dures (les relais des grandes églises des capitales ★ Q181) | dénoncer un recherché ; livrer la Main Noire ; les villes de la Lumière te ferment leurs portes et le déménagement à Cendrebourg vient plus tôt (« trop sombre » ★, voir D5) | à la fin, la carte de VieuxGoy « le Boucher convaincu » ★ (Q142) devient possible | O1, O2, O3, R, E |

---

## 7. Les indices dans le monde (jamais un chiffre) ☆

| Où | Lumière ardente | Lumière / tiède | Neutre | Ombre / tiède | Ombre profonde |
|---|---|---|---|---|---|
| **Les passants** (les phrases de la rue) | ils s'écartent, avec respect et un peu de peur | ils saluent ★ | rien de particulier ; un jour, « Toi, on ne sait jamais de quel côté tu es » | ils chuchotent ★ | ils changent de trottoir ; des enfants se signent |
| **Le reflet dans la vitre** (le Miroir) | un reflet trop net, trop doré, qui sourit une seconde avant toi | une lumière chaude sur le visage | un reflet un peu flou, qui hésite | une ombre plus longue que toi | le reflet reste une seconde de trop quand tu t'en vas |
| **La Faucheuse** | « Tu brilles tant qu'on ne voit plus ce que tu écrases. » | elle s'ennuie de toi | elle se moque ★ | « Tu progresses. » | « Enfin, quelqu'un qui me comprend. » |
| **Garrick** ★ | absent, ou en colère | déçu | blagueur | proche | inquiet pour toi |
| **Le chat** (il parle aux animaux ★) | il te fixe et ne vient plus sur tes genoux | | | | il dort contre la porte, comme s'il montait la garde |
| **Le mendiant** | il remercie trop bas, sans te regarder | il remercie | il remercie | il te fait un clin d'œil | il ne prend plus ta pièce |

- Le portrait des parents reste lié aux étoiles et à la vérité ★ : on ne s'en sert pas pour les degrés.
- La gazette des paliers reste celle de la jauge ★ (elle dit ce que pense le monde).
- ☆ La seule fois où les degrés « se montrent », c'est à la toute fin, dans le résumé de VieuxGoy ★ (Q116) et sa carte à collectionner : un mot, jamais un nombre (« le Zélé », « le Tiède », « celui qui ne savait pas » ★, « le Boucher convaincu » ★). Voir D8.

---

## 8. La simulation (120 jours)

Le banc d'essai : `sim_coh.js` (la partie automatique, sans affichage), copié en `sim_degres.js` avec le relevé des degrés chaque nuit et les petits gestes de chaque stratégie (le mendiant, les recherchés, le Carrefour, les soins gratuits, les dédommagements). 8 parties de 120 jours par stratégie (les faillites des premiers jours sortent du compte : il en reste 5 à 8), puis 6 parties de 200 jours en mode conquête (la stratégie vise les royaumes à libérer, pour faire venir l'armure).

Les six stratégies :
- **Lumière** : missions en terres de lumière, chaque recherché dénoncé, le mendiant chaque jour (8 fois sur 10), des soins gratuits, les dédommagements généreux, le serment au Carrefour (8 fois sur 10) ;
- **Ombre** : missions en terres d'ombre, les recherchés cachés (8 fois sur 10), des pièges, le marché noir, le serment aux Bannis ;
- **Main Noire** : comme l'Ombre, plus le prêt de la Main Noire au 3e jour et ses services ;
- **Neutre** (l'équilibriste) : il regarde la jauge (elle est visible ★) et choisit ses missions pour la ramener au centre ; il laisse passer les recherchés ; il reste libre au Carrefour ;
- **Distrait** : la stratégie « neutre » de `sim_coh.js` (il va où le butin est le meilleur, sans regarder la jauge), et il dénonce ou cache un recherché sur deux, au hasard ;
- **Girouette** : Lumière jusqu'au jour 50, puis Ombre.

### 8.1 Le premier jour où chaque degré est atteint (médiane, et part des parties qui l'atteignent)

| Stratégie | tiède | ±2 | ±3 | Temps passé au ±3 | Non-retour | Serment |
|---|---|---|---|---|---|---|
| Lumière | j10 (88 %) | j20 (63 %) | j34 (63 %) | 65 % | ancrage 63 % (j54), actes graves 38 % (j91) | 63 % (j20) |
| Distrait | j17 (88 %) | j32 (88 %) | j104 (50 %) | 12 % | ancrage 25 % (j103) | jamais |
| Girouette | j10 (100 %) | j22 (63 %) | j37 (63 %) | 23 % | ancrage 38 % (j56) | 63 % (j27) |
| Neutre | Lumière tiède 13 % (j77) | — | — | — | aucun en 120 jours (voir 8.3) | jamais |
| Ombre | j18 (100 %) | j34 (100 %) | j72 (100 %) | 42 % | actes graves 100 % (j92), ancrage 100 % (j92) | 100 % (j74) |
| Main Noire | j22 (75 %) | j44 (75 %) | j81 (75 %) | 31 % | actes graves 50 % (j84), ancrage 75 % (j101) | 38 % (j82) |

**Chaque degré est atteint** : les trois degrés de Lumière par la Lumière, le Distrait et la Girouette ; les trois degrés d'Ombre par l'Ombre et la Main Noire ; le Neutre par l'équilibriste, qui y passe 95 % de ses 120 jours.

### 8.2 Ce que la simulation montre

- **La Lumière va plus vite que l'Ombre** (le dernier degré vers le jour 34 contre le jour 72) : c'est voulu, c'est le chemin que le monde encourage ★ (16/10).
- **Le volume ne suffit pas** : le Distrait, qui n'a jamais juré, plafonne sous la Lumière ardente pendant des mois (engagement +64 du jour 80 au jour 120) ; la moitié des parties n'y entrent que vers le jour 104, grâce à des actes graves.
- **L'inertie** : la Girouette, ardente au jour 50, se met à l'Ombre. Sa jauge redescend de +100 à +19 au jour 120 ; son degré, de +3 à +2 vers le jour 75, puis à +1 vers le jour 105. Elle n'a jamais atteint l'Ombre en 70 jours d'Ombre, et 38 % des parties sont retenues par l'ancrage (jamais neutres).
- **La cohérence** : quand le degré n'est pas neutre et que la jauge est hors de la zone neutre, ils sont du même côté dans 100 % des relevés (92 % pour le neutre verrouillé, voir 8.3).
- **Aucune erreur** dans toutes les parties (ni exception, ni texte « undefined »).

### 8.3 Le neutre reste jouable

- En 120 jours, l'équilibriste reste neutre 95 % du temps (une partie sur huit passe Lumière tiède vers le jour 77). Sa tiédeur atteint 45 vers le jour 70, et 90 au jour 120.
- **Mais le monde le pousse vers la Lumière** : même en choisissant ses missions pour ramener la jauge, la jauge de l'équilibriste monte à +39 au jour 120 (médiane), et à +83 au jour 200 ; son degré suit (Lumière tiède dès le jour 145 dans le mode conquête). Sans point de non-retour, un neutre qui joue longtemps finit tiède.
- **Avec le non-retour du neutre** : dans 8 parties de 160 jours où l'on a abaissé le seuil à 2 pièces (pour le voir arriver, car les parties automatiques n'ont que 2 ou 3 pièces à ce moment-là), le non-retour tombe dans 100 % des parties (vers le jour 100), et toutes restent neutres jusqu'au bout, **alors que leur jauge visible monte à +60**. D'où la question D3 : avec la règle validée du sceau, une telle partie serait scellée en Lumière.

### 8.4 Ce que la simulation ne voit pas encore

- **Le sceau n'arrive jamais en 200 jours**, même en mode conquête (7 pièces au plus) : la 8e pièce demande de libérer les Terres des Bannis (D9). Les degrés au moment du sceau ne sont donc vérifiés que par des essais à la main (`test_degres.js` : le sceau neutre, le camp scellé, le parjure, l'ancrage, les verrous opposés, la migration ; 15 essais réussis).
- Les parties automatiques ne jouent ni le Parrain du côté Lumière (« le dénoncer »), ni le sabotage de la Faucheuse, ni les chantiers : ces choix sont branchés, mais peu testés.

Les bancs d'essai (dans le dossier de travail de Claude, pas dans le dépôt) : `sim_degres.js`, `analyse.js`, `test_degres.js`, et `degres_navigateur.js` (le vrai jeu dans un navigateur : le cadre de débogage n'apparaît qu'avec `?degres`, la migration d'une vieille sauvegarde, aucune erreur ; plus `smoke2.js`, toutes les scènes s'ouvrent, et `fuzz7.js`, le joueur au hasard, sans erreur).

---

## 9. Le prototype (dans le code, sans effet sur les choix)

- `src/degres.js` (chargé à l'identique dans `index.html` et `web/jeu.html`) : `REGLES_DEGRES` (tous les chiffres de ce document), `etatDegres(G)`, `degreDe(G)` (de −3 à +3), `nomDegre(G)`, `nuitDesDegres(G)`, `noterDegre(G, cle)`, `finsPossiblesDegres(G)`.
- Deux branchements dans `src/regles.js` : `pencher` signale chaque geste du barème aux degrés, et la nuit appelle `nuitDesDegres` (sous `sansPlanter` : une erreur ne bloque jamais la nuit).
- **La migration** (`src/sauvegarde.js`) : une partie sans degrés les déduit de ce qu'elle a vécu (70 % de la jauge, le serment, les recherchés déjà livrés, la tiédeur d'un neutre déjà avancé, le camp scellé). Une partie neuve part de zéro.
- **Le mode de débogage**, jamais visible en jeu normal : `lireDegres()` dans la console, ou `?degres` à la fin de l'adresse (ou `localStorage['debug.degres'] = '1'`) pour un petit cadre en bas à gauche : le degré, l'engagement, la jauge, la tiédeur, les actes graves, les verrous, les fins encore possibles, les derniers changements.
- Rien d'autre ne lit les degrés : aucun choix, aucun texte ne change encore.

---

## 10. Les questions pour le joueur

- **D1. La jauge visible** : on la garde telle qu'elle est (le HUD avec son chiffre et le nom du palier, le livre des deux voies) à côté des degrés cachés ? Ma recommandation : oui, elle est validée et elle dit autre chose (le regard du monde). Ou bien faut-il l'adoucir (plus de chiffre, seulement le dégradé), pour que le joueur ne devine pas trop ses degrés ?
- **D2. Sept degrés**, avec ces noms de travail, et le dernier degré réservé à ceux qui ont juré ou commis des actes graves : d'accord ?
- **D3. Le non-retour du neutre** (tiédeur 45, 6 pièces, pas de serment) : les conditions te vont-elles ? La simulation montre un vrai conflit : un neutre verrouillé dont la jauge visible continue de monter (+60 au jour 160, parce que le monde pousse vers la Lumière) serait scellé en Lumière par la règle validée du sceau. Trois solutions : (a) après le non-retour, la jauge visible ne peut plus sortir de la zone neutre (le monde ne croit plus que tu choisiras) ; (b) au sceau, le degré neutre verrouillé l'emporte sur la jauge, comme le serment l'emporte déjà ★ ; (c) on laisse faire, et le neutre verrouillé peut être scellé dans un camp qu'il n'a pas choisi (une fin à part, à inventer). Ma préférence : (b), qui ne touche ni à la jauge ni au barème.
- **D3 bis. Le moment du non-retour du neutre** : à 6 pièces, il arrive tard (les parties automatiques n'ont que 2 ou 3 pièces au jour 160) ; faut-il plutôt le lier à l'âge du comptoir (par exemple la 4e étoile, ou un an de jeu après le Carrefour refusé) ?
- **D4. La difficulté de revenir** : une Lumière ardente qui veut redevenir neutre doit faire environ 30 gestes graves contraires, et trois semaines au dernier degré l'empêchent de redevenir neutre. Trop dur, pas assez, ou juste ?
- **D5. « Trop sombre »** ★ : l'Ombre profonde ferme-t-elle les villes de la Lumière dès qu'on l'atteint, ou seulement au sceau (le déménagement à Cendrebourg) ?
- **D6. Lumière cruelle (L4)** seulement depuis la Lumière ardente, et la Lumière retournée (L2) impossible depuis l'ardente (on ne voit plus les fissures) : d'accord ?
- **D7. Le neutre qui penche** (Lumière ou Ombre tiède, mais dans la zone neutre au sceau) : les trois réponses au Sage (Valdric, un Banni, la garder) lui restent-elles toutes offertes, ou seulement celle de son côté et « la garder » ?
- **D8. La révélation à la fin** : le résumé de VieuxGoy et sa carte nomment-ils le chemin des degrés (par un mot, jamais un nombre), ou les degrés ne se montrent-ils jamais ?
- **D9. La 8e pièce d'un joueur de Lumière** : dans le code, l'armure demande les huit royaumes, Terres des Bannis comprises ; un joueur de Lumière doit donc y conquérir des contrées, et chaque mission y compte ☾ (jauge et degrés). Faut-il qu'une mission en terre des Bannis menée pour la Confrérie compte ☀ pour un joueur juré à la Lumière (une campagne), ou est-ce voulu (la guerre salit) ?
- **D10. Les poids** : livrer la Main Noire (8) et le Parrain dénoncé ou la bague baisée (10) sont les plus lourds ; les missions (1 et 1,5) les plus légères. Certains gestes doivent-ils peser plus, ou moins ?
