# Étape 9 — Le Bien et le Mal (+ marché noir) : préparatifs

Écrit en v 0.50, avant de commencer. But : partir de ce qui existe déjà dans le jeu, proposer un
découpage en sous-étapes jouables, et lister les questions à trancher avec le joueur.

## 1. Ce qui existe déjà (à réutiliser, pas à refaire)

| Mécanique | Où | État |
|---|---|---|
| La jauge du mal `G.mal` | `regles.js` : monte avec les missions réussies en terres d'ombre (`EFFETS_CAMP.mal`), les morts voulus et les sabotages de la Faucheuse | Invisible pour le joueur, sauf par le côté de l'armure |
| Le camp scellé `G.camp` | `regles.js` : à la 9e pièce d'armure, `G.mal > G.reputation` → camp du mal, sinon du bien | Un seul moment, définitif |
| Les terres de lumière et d'ombre | `data.js` ZONES : 3 zones `camp: 'bien'` (Pandas, Elfes, Paladins), 3 zones `camp: 'mal'` (Gobelins, Loups-garous, Nécromancien), `EFFETS_CAMP` (réputation ×1,5 en lumière, butin ×1,35 en ombre) | Construit |
| Les aventuriers qui refusent le mal | `envoyerDans` : seuls les vénaux (`envie === 'or'`) acceptent une terre d'ombre | Construit |
| La Faucheuse | faveur, cadeau, missions de sabotage (pièges), thème musical | Construit |
| La Main Noire | prêt « sans questions » débloqué par `G.camp === 'mal'` ou `G.mal >= SEUIL_MAIN_NOIRE` | Construit |
| L'armure sombre / claire | `coteArmure` | Construit |
| Le gobelin Grippesou, les squelettes des récits | figurants, bêtes | Dessinés dans l'ancien moteur (Grippesou refait en v 0.49) |

Conclusion : le jeu a déjà une jauge du mal et un camp. Il manque le **versant visible** (le joueur
ne voit rien de tout ça), les **clients des peuples du mal**, les **objets et décors marqués**, les
**dialogues qui changent** et le **marché noir**.

## 2. Proposition de découpage (chaque sous-étape reste jouable)

### 9a — La jauge visible et les deux camps qui comptent
- Une seule jauge « lumière ⟷ ombre » (de −100 à +100), calculée à partir de `G.mal` et des
  réussites par camp, affichée au bureau (nouveau tiroir « Ta réputation chez les deux camps ») et
  en petit sur l'ardoise de fin de journée.
- Chaque réussite compte pour son camp : `G.reussites.bien` / `G.reussites.mal` (nouveaux compteurs,
  avec migration de sauvegarde).
- Effets dès maintenant : taux de la banque meilleurs côté lumière (−3 points par palier de
  lumière), réputation gagnée ×1,5 en terres de lumière seulement si on est côté lumière (sinon ×1),
  butin d'ombre plus gros seulement si on est côté ombre.

### 9b — Les peuples du mal comme clients
- Six peuples : gobelins, orcs, loups-garous, vampires, momies, trolls. Corps complets dans le
  moteur `corpsVueHD` (4 angles, morphologies : trapu/massif, élancé/pâle, bandelettes, fourrure),
  bustes au comptoir, tailles (à fixer avec le joueur comme pour les peuples du bien).
- Ils n'arrivent qu'une fois la jauge passée côté ombre (ou dès le premier palier d'ombre, à
  décider) ; ils partent dans les terres d'ombre ; leurs goûts et leurs commandes (objets du mal).
- Dialogues propres : voix rauque, menaces drôles ; visages fermés s'ils viennent chez un marchand
  de lumière.

### 9c — Les objets et les décors des deux camps
- Au marché : quelques objets marqués `camp: 'bien'` (eau bénite, amulette solaire, pain de
  l'abbaye) ou `camp: 'mal'` (poison, crâne-lanterne, grimoire). Les acheter fait bouger un peu la
  jauge ; les vendre à un client de l'autre camp le vexe.
- À la brocante : décorations « lumineuses » ou « sombres » (chandelier d'argent / crâne de
  troll…), qui changent l'ambiance de l'arrière-boutique et attirent le camp correspondant.

### 9d — Les dialogues et les affaires selon le camp
- Chaque peuple a un ton par palier : chaleureux / neutre / froid / hostile. Le camp qui ne t'aime
  pas paie moins, commande moins, refuse parfois de venir ; l'autre fait de meilleures affaires
  (clients plus riches, lettres plus fréquentes).
- La Faucheuse et la Main Noire deviennent les « alliés » du côté ombre ; côté lumière, un
  équivalent à inventer (le héraut de la Confrérie ? l'abbaye des Pandas ?).

### 9e — Le marché noir
- Certains soirs (1 soir sur 3, annoncé par une rumeur au marché ou un papier glissé sous la
  porte), une porte dérobée s'ouvre dans l'arrière-boutique : grimoires interdits, potions
  illégales, artefacts ; voyageurs nocturnes aux quêtes farfelues et très lucratives.
- Risque : si le voyageur se fait prendre, ça retombe sur le joueur (amende par la garde, un jour
  de fermeture, ou visite de la garde qui fouille la réserve). Le marché noir pousse vers l'ombre.

Ordre proposé : 9a (petit, pose les bases) → 9b (le gros morceau visuel) → 9c → 9d → 9e.

## 3. Questions à trancher avec le joueur (avant 9a)

1. **Une jauge ou deux ?** Une seule jauge lumière ⟷ ombre (plus lisible), ou deux réputations
   séparées (on peut être aimé des deux, ou détesté des deux) ?
2. **Peut-on changer de camp ?** Aujourd'hui, le camp est scellé à la 9e pièce d'armure. Garder le
   sceau définitif, ou le rendre réversible à grand prix (une quête de rédemption / de corruption) ?
3. **Quand arrivent les clients du mal ?** Dès que la jauge passe côté ombre, dès le premier
   gobelin rencontré en mission, ou seulement après une zone d'ombre conquise ?
4. **Les conséquences du marché noir** : amende, fermeture d'un jour, fouille et saisie, ou
   perte de réputation chez les deux camps ? Et la garde : un personnage récurrent ?
5. **Le camp et l'histoire** : Garrick (le grand retournement) doit-il pousser discrètement le
   joueur vers l'ombre (cadeaux, conseils) dès cette étape ?
6. **Les tailles des six peuples du mal** (comme pour les peuples du bien) : à donner.
7. **La durée** : la jauge doit-elle pouvoir se décider en 10 jours, 30 jours, plus ?

## 4. Décisions du joueur (14/10, v 0.52)

1. **Une seule jauge** lumière ⟷ ombre. On commence avec ça.
2. **Le sceau reste** (9e pièce d'armure), avec plus tard une quête de rédemption / corruption très chère pour le renverser une seule fois.
3. **Les clients du mal arrivent dès le premier palier d'ombre**, et c'est au **marché noir, le soir**, qu'on les rencontre d'abord : ça donne un sens au marché noir, et la Main Noire (la mafia qui prête au côté sombre) s'y installera plus tard. Voir § 5 pour la proposition détaillée.
4. **Une garde récurrente** (un capitaine avec son visage), amende la première fois, fouille et saisie ensuite. Il faut **de nouveaux habits et armures de garde pour toutes les races du bien**. Le joueur peut **soudoyer** la garde avec des objets achetés aux voyageurs : plus de chances si l'objet plaît à la race du garde ; si ça rate, le garde repart *rarement* avec l'objet.
5. **Garrick pousse vers l'ombre dès maintenant, mais très, très subtilement** : des choses dites à la légère, des blagues sur les forces du mal, jamais un conseil direct.
6. Les peuples du mal choisis : gobelins, orcs, loups-garous, vampires, momies, trolls (tailles à donner). Et le peuple **panda** entre côté bien.
7. **Durée** : une jauge qui peut basculer en 10 à 15 jours ; on ajustera.

Et l'histoire derrière tout ça (dit par le joueur, à garder secret dans le jeu) : les **Gardiens de la paix** ont commis des horreurs, caché la vérité, et baptisé « forces du mal » ceux qui les gênaient. Celui qui choisit les Gardiens finit par servir des bourreaux maquillés en héros ; celui qui choisit les « forces du mal » se retrouve, à la fin, du côté des justes. Un complot à tisser avec le temps, par les récits et l'avancement (voir § 6, questions sur le récit).

## 5. Proposition : le marché noir comme porte d'entrée du côté sombre

- **Où** : une porte dérobée dans l'arrière-boutique (visible seulement le soir, à la promenade), qui mène à une cave ou une ruelle sous les lanternes rouges : un comptoir de fortune, trois ou quatre silhouettes dans l'ombre, un musicien de rue.
- **Quand** : pas tous les soirs. Un **papier glissé sous la porte** le matin (« Ce soir, derrière le tonneau. ») ou une rumeur au marché annonce l'ouverture. Au début 1 soir sur 3, plus souvent quand la jauge penche vers l'ombre.
- **Qui** : d'abord un **passeur** (un humain louche, le seul visage humain du lieu), puis au fil des soirs les **clients du mal** : un gobelin qui marchande, un orc qui cherche une bonne lame, un loup-garou qui veut voyager de nuit… Au premier palier d'ombre ils osent venir au comptoir en plein jour.
- **Quoi** : acheter des objets interdits (poison, grimoire, crâne-lanterne) ; équiper des voyageurs nocturnes pour des quêtes farfelues et très payantes ; **vendre ses trouvailles** sans questions, à meilleur prix qu'aux enchères.
- **Le risque** : à chaque soir de marché noir, un risque que la garde descende. Si le voyageur nocturne se fait prendre, la garde vient au shop le lendemain (amende, puis fouille). Le soudoiement joue ici.
- **Plus tard** : la Main Noire ouvre sa table au fond de la cave (ses prêts « sans questions » y passent, plutôt qu'à la banque) ; des rumeurs sur les Gardiens s'y entendent avant partout ailleurs (c'est là que la vérité commence à filtrer : le marché noir n'est pas le mal, c'est la clandestinité des gens que les Gardiens ont mis au ban).
- **Idées en plus** : un **mot de passe** qui change (donné par le papier), une **lanterne rouge** à accrocher à la façade pour signaler qu'on est preneur, un chat noir qui annonce la garde, un **registre secret** dans le bureau (le livre de comptes du marché noir, à cacher pendant une fouille).

## 6. Questions sur le récit général (à poser au joueur avant 9d)

1. Les **Gardiens de la paix** : qui sont-ils concrètement ? Un ordre (les Paladins de la Citadelle ?), un conseil de la Comté, une confrérie des aventuriers ? Un chef avec un visage ?
2. **Quelles horreurs** ont-ils commises ? (un peuple chassé de ses terres, un village brûlé mis sur le dos des gobelins, un pacte avec le dragon…) Il en faut une concrète, que des indices puissent pointer.
3. **Garrick** contrôle les forces du mal (grand retournement). Avec le complot, est-il **un Gardien** (le vrai méchant côté « gentils ») ou **le chef des bannis** (donc, au fond, du bon côté) ? Ça change tout ce qu'on lui fait dire.
4. Le **dragon sous la montagne** : toujours la menace finale, ou un bouc émissaire inventé par les Gardiens ?
5. À quel moment le joueur **apprend la vérité** : à mi-parcours (et il peut encore choisir), ou seulement à la fin (coup de théâtre) ?
6. Les peuples du bien **savent-ils** ? (les Pandas du Monastère gardent-ils le secret ? un elfe dissident ?) Qui, parmi les clients récurrents, pourrait être le premier à laisser échapper un indice ?
7. Les **deux fins** : garder « équiper les héros » / « aider la menace », ou les inverser une fois la vérité connue ?
