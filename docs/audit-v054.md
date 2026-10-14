# Grand point final : audit v 0.54 (nuit du 14 octobre)

Trois relectures complètes en parallèle : le **récit**, le **gameplay** (simulations de 100 à 200 parties de 60 jours par stratégie), et le **visuel** (140 captures 1920×1080 de toutes les scènes). Ce qui est corrigé est dans la v 0.54 (artefact, version 56). Ce qui reste est rangé plus bas, par ordre d'importance.

## Chiffres avant / après (médianes, IA « neutre », 60 jours)

| | avant (v 0.53) | après (v 0.54) |
|---|---|---|
| Argent au jour 30 / 60 | 14 800 / 72 700 | 5 200 / 26 000 |
| Réputation au jour 30 / 60 | 48 / 163 | 24 / 37 |
| Camp scellé sans l'avoir choisi | 97 % des parties | 44 % (et seulement si la jauge a penché) |
| Bascule lumière → ombre au jour 30 | jamais avant le jour 60 | environ 13 jours |
| Côté ombre : palier −1 / −3 | jour 13 / 18 | jour 13 / 19 |

## Corrigé dans la v 0.54

**Gameplay**
- La migration des « âmes offertes » ne se jouait jamais (la partie neuve avait déjà le drapeau) : corrigé, et le camp scellé par l'ancienne règle (une seule mort suffisait) est recalculé.
- La jauge ne pouvait plus revenir après 15–20 jours d'un même camp : l'écart des réussites est maintenant borné à 14 au moment où on les compte.
- Un camp scellé ne repasse plus de l'autre côté (taxe et garde de l'ombre pour un joueur scellé lumière).
- La 9e pièce (le sceau) attend aussi que tu aies penché d'un côté : plus de joueur neutre scellé « lumière » d'office.
- Soudoyer la garde avec un rebut à 5 p. marchait à 77 % : la chance dépend maintenant de la valeur du trésor par rapport à l'amende (10 % de base, +30 % s'il aime, jusqu'à +45 % selon la valeur).
- La taxe de la Confrérie ne frappe plus l'argent emprunté.
- La réputation monte de moins en moins vite au-delà de 12 (elle garde un sens : refus, échecs et pièges coûtent encore).
- Les étoiles ne sont plus toujours le meilleur choix : danger 0,12 par étoile, butin ×1 / 1,2 / 1,4 / 1,7 / 2,2.
- Trouvailles : le prix demandé va de 0,35 à 1,2 de la valeur restaurée (le flair sert enfin : certaines offres sont perdantes).
- Côté ombre : réputation ×0,5 (au lieu de 0) en terres d'ombre, butin allié ×1,25 ; prêt de la Main Noire utile (200 p., 25 %, 6 jours) ; pèlerins mieux payés (35–50) ; commandes du marché noir plus risquées (0,2).
- Les échecs ne comptent plus comme des morts pour la Faucheuse ; le poste « colporteur » a un nom dans les comptes.

**Récit**
- La quête « pillage » ne révèle plus au jour 1 les enfants gobelins enchaînés (chariots fermés à clé, « ça pleurait dedans »).
- Le murmure de la cave ne désigne plus Garrick par sa cape verte ; son conseil dans la cave est un souvenir (« Garrick t'avait dit un jour... »).
- Les nouvelles sur le Conseil arrivent selon le jour (Terres d'avant : jour 8, anniversaire du Sage : 12, fondations du Bourbier : 18, moine panda : 25).
- « Le grand oubli » devient « le long sommeil » (on ne nomme pas le secret).
- Descriptions des terres d'ombre au conditionnel du Conseil ; « Conseil » toujours avec une majuscule ; « conseil des Nains » pour la mine.
- Un Banni devant le crâne de troll : « Tu sais au moins à qui il appartenait ? » ; une réplique morte supprimée.

**Interface**
- Récits : le plan moyen (arbres, rochers) passe derrière le voyageur, prend la couleur du paysage, rochers dans les déserts et terres brûlées ; les boutons et le panneau des trouvailles sont dans l'interface (ils n'étaient plus coupés ni déplacés par le zoom).
- Express : « reste N » sur la ligne du nom, la liste ne se chevauche plus.
- Soirée : le palier de clients tient dans son cadre. Comptoir : la consigne ne déborde plus. Cinématiques : « clique pour continuer » ne touche plus le cadre.
- Registre du bureau : chaque tiroir en blocs encadrés (un sujet par bloc).

## Construit, en attente de ta validation (pas encore publié)

**Le grand monde** (commit « Le grand monde » sur la branche) : la carte qu'on fait glisser et zoomer, les royaumes dessinés, dix contrées de plus. Planches à regarder : `docs/planches-v054/` (vue d'ensemble, zoom, médaillons, bulle, début de partie).

## À faire (par ordre d'importance)

1. **Décors restés au vieux standard** : Express Grippesou (le pire : chariot en aplats, sol uni), Banque (mur plat, plaque unie, personnage minuscule), Atelier, cave du marché noir (aplats, personnages minuscules), chambre (grand mur vide), pavés gris répétitifs (façade, rénovation, faillite, place du marché), « Bête de l'antre » en gros pixels.
2. **Cinématiques** : intro (personnages trop petits, coupe sèche rivière → Comté, « MIAM » en double, coffre en l'air), faillite (cinq plans presque identiques, banquier devant l'enseigne, rectangle blanc), façade → comptoir sans transition.
3. **Petits défauts d'interface** : lettres qui débordent de l'ardoise, plaque et bouton vides store fermé, « Réserve » sur le bouton Agrandir, marché (étiquettes coupées, message du Bazar sur le bouton), promenade (porte devant l'étagère), atelier (titre sur le cadre, liste des employés), banque (première ligne collée), ardoise du bureau dans une autre police, répertoire serré, rénovation (cadres superposés), boutons rouges plats du marché noir et bruns de l'Express (pas en bois doré comme partout).
4. **Portraits à revoir avec toi** : l'encolure lacée en V fait un « cou » très fin et une traînée de points chez l'orc, le vampire et le troll ; mèches claires en travers du visage de l'elfe ; momie peu contrastée. Ce sont des designs que tu as validés : je n'y touche pas sans ton avis.
5. **Gameplay** : l'argent n'a plus d'usage après le jour 20–30 (toutes les améliorations coûtent 5 380 p.) : il faut de vraies dépenses de fin de partie (dons à un camp qui font bouger la jauge, déménagement de l'auberge, le bar, les mercenaires) ; un 2e amateur aux enchères pour les armures et vêtements ; marché noir encore un peu trop sûr ; le mendiant, la fontaine et le chien n'ont toujours pas d'effet (étape 13).
6. **Récit** : le chemin de l'ombre récompense encore la cruauté (âmes offertes à la Faucheuse = penchant vers les Bannis) : il faudrait séparer le **camp** (Confrérie / Bannis) et la **cruauté** (Faucheuse) ; trois noms pour la même chose (Conseil des Gardiens, Confrérie, Confrérie du Dernier Rempart) ; l'armure livrée par la Confrérie même quand s'ouvrent des terres d'ombre ; le dragon existe en jeu (la Bête crache du feu) ; les visites de Garrick s'arrêtent au jour 56 et ne réagissent pas à tes choix.

## Questions pour toi (récit)

1. **La Main Noire** : une partie des Bannis (leur réseau, que le Conseil appelle une mafia), ou des profiteurs qui jouent sur les deux tableaux ?
2. **La Faucheuse** a-t-elle un camp ? Peut-elle révéler la vérité, ou briser le sort ?
3. **Le sort d'oubli** : qui y échappe (momies, mendiant, chien, Garrick, la Faucheuse) ? Comment se brise-t-il : un objet, un lieu, l'armure ?
4. **L'armure** : était-elle à l'origine celle d'un champion des Bannis, trahi par le Sage ? Le joueur peut-il la retourner contre le Conseil ?
5. **La Bête de l'antre** : une créature du Sage, un appât, ou rien à voir avec le dragon ?
6. **Les fins** : fin « Gardien » amère ou rachat possible ? Fin « ombre cruelle » (Faucheuse) distincte de la fin « Bannis justes » ? Fin cachée où l'on brise le sort pour tout le monde ?
7. **Le Sage** : un nom, un visage, une apparition avant la fin (une visite au comptoir au palier de lumière +3 ?) ?
8. **Les pandas** : neutres, hors des cinq royaumes ? Premier allié côté lumière qui doute ?
9. **Garrick** après le jour 56 : ses visites doivent-elles dépendre de ton camp et de tes sabotages ?
10. **Le mendiant** : quelqu'un du passé (un ancien du Conseil repenti ? le champion de l'armure ?)
11. **Les noms** : le Conseil gouverne et la Confrérie du Dernier Rempart est son bras armé (siège à la Citadelle) — d'accord ?
