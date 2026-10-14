# Étape 9½ — Le lot visuel : préparatifs

Écrit en v 0.56, avant de commencer. But : remettre au niveau tout ce qui est resté dessiné à
l'ancien standard (aplats, personnages minuscules, sols unis), refaire les deux cinématiques faibles
et nettoyer les petits défauts d'interface relevés par l'audit v0.54. Planche de l'état actuel :
`docs/planches-v057/etat.png`.

## 1. État des lieux

| Lieu | Ce qui ne va pas | Ce qui est déjà bien |
|---|---|---|
| **Express de Grippesou** | Le pire : chariot en aplats (bâche beige unie, deux carrés), sol uni beige, ciel et collines repris tels quels, Grippesou petit, la bulle couvre le bas de l'écran. | Grippesou lui-même (refait en v0.49). |
| **Banque Centrale** | Mur de briques plat et répétitif, plaque unie, les trois banquiers coupés à mi-corps derrière le guichet, le joueur minuscule dans le coin, la liste des prêts collée en haut de son cadre. | Lustres, bannières, ambiance. |
| **Cave du marché noir** | Murs en aplats, la voûte est un trou noir avec un escalier en marches plates, personnages petits, boutons rouges plats (pas en bois doré comme partout). | Lanternes qui vacillent, chat noir, le récit des aînés. |
| **Chambre** | Un grand mur vide au-dessus du lit, l'épée accrochée seule au milieu. | Lit selon le luxe, fenêtre de nuit, coffre. |
| **Atelier** | Le titre déborde sur le cadre, la liste des employés est serrée en bas, la pièce est un long mur vide. | Établi, outils. |
| **Pavés** (façade, rénovation, place du marché, faillite) | Le même gris répétitif partout. | — |
| **La Bête de l'antre** | Encore en gros pixels (ancien moteur). | — |
| **Cinématique d'intro** | Personnages trop petits, coupe sèche rivière → Comté, « MIAM » en double, coffre qui flotte. | Forêt, rivière, ambiance. |
| **Cinématique de faillite** | Cinq plans presque identiques, le banquier devant l'enseigne, un rectangle blanc. | Elle a maintenant sa musique dramatique (v0.56). |
| **Façade → comptoir** | Pas de transition, on saute d'un écran à l'autre. | — |

Petits défauts d'interface (audit v0.54) : lettres qui débordent de l'ardoise, plaque et bouton vides
quand le store est fermé, « Réserve » écrit sur le bouton Agrandir, étiquettes coupées au marché,
message du Bazar sur le bouton, porte devant l'étagère dans la promenade, ardoise du bureau dans une
autre police, répertoire serré, cadres superposés à la rénovation, boutons rouges du marché noir et
bruns de l'Express.

## 2. Découpage proposé (chaque sous-étape reste jouable et passe par des planches)

### 9½a — Les décors
1. **Pavés** : une seule belle texture de pavés (pierres de tailles variées, joints, mousse, flaques
   selon le temps), partagée par la façade, la rénovation, la place et la faillite. Elle servira
   aussi à la rue de l'étape 10c.
2. **Express de Grippesou** : vrai chariot en volume (bâche rapiécée, roues cerclées, lanterne,
   bric-à-brac qui dépasse, enseigne peinte de travers), sol de terre battue, Grippesou à l'échelle.
3. **Banque** : boiseries et marbre, plaque gravée en or, guichet plus bas pour voir les banquiers
   jusqu'à la taille, le joueur à l'échelle devant le guichet.
4. **Cave du marché noir** : voûte de pierre en relief, escalier qu'on voit descendre, caisses de
   contrebande, étagères de fioles, personnages plus grands ; boutons en bois doré.
5. **Chambre** : poutres, étagère de souvenirs (les trophées des aventuriers), tapisserie, armoire ;
   le mur se remplit avec le luxe de la chambre.
6. **Atelier** : murs d'outils, copeaux, établi détaillé ; on y prévoit déjà le **coin de la forge**
   (vide et bâché) que l'étape 10b ouvrira.
7. **La Bête de l'antre** dans le moteur HD.

### 9½b — Les cinématiques
1. **Intro** : personnages plus grands, fondu enchaîné rivière → Comté, un seul « MIAM », le coffre
   posé au sol.
2. **Faillite** refaite en quatre plans qui racontent : les huissiers frappent à la porte ;
   l'enseigne qu'on décroche ; tes affaires sur le pavé, sous la pluie ; Garrick qui te tend la main.
3. **Façade → comptoir** : la porte s'ouvre, la caméra entre, fondu vers le comptoir.

### 9½c — L'interface
Tous les défauts de la liste ci-dessus, et les boutons en bois doré partout.

## 3. Questions pour toi

1. **L'ordre** : je propose les décors d'abord (9½a), puis l'interface (rapide, 9½c), puis les
   cinématiques (9½b). D'accord ?
2. **La faillite** : les quatre plans te vont (huissiers, enseigne décrochée, affaires sous la
   pluie, Garrick qui tend la main) ? Ou plutôt une fin sans Garrick, plus dure ?
3. **La cave du marché noir** : on la garde de la même taille, ou on la creuse (une deuxième salle
   au fond, pour la table de la Main Noire et le coin des aînés) ?
4. **La chambre** : quels objets veux-tu y voir (trophées des aventuriers, lettres reçues, portrait
   de famille pour l'étape 14 « vie du personnage ») ?
5. **Les portraits signalés par l'audit** (encolure en V qui fait un cou très fin chez l'orc, le
   vampire et le troll ; mèches claires sur le visage de l'elfe) : je te propose des corrections en
   planche pendant 9½, ou tu préfères ne pas y toucher ?
6. **Grippesou** : quand la rue arrivera (10c), son chariot pourrait se garer dans la rue certains
   jours au lieu d'être un écran à part. On le prévoit déjà ?
