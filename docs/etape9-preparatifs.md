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
