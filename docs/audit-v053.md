# Audit du jeu (v 0.53, 14/10)

Fait par une relecture indépendante (agent), avec deux simulations node : 4 000 tirages par quête
(survie, profit attendu) et 200 parties de 30 jours avec une IA qui envoie chaque client dans la
zone la plus dangereuse ouverte, équipement complet (l'IA achète sans limite au prix de base : les
montants sont des ordres de grandeur). Le suivi de chaque constat (corrigé, reporté) est dans le
§ « Suivi » en bas.

1. **[équilibrage] Le danger d'une zone ne change pas la survie.** `chanceEtapeBase` ne regarde que l'objet donné, le niveau et les événements : avec un baluchon complet, un novice revient vivant à 93–99 % quelle que soit la zone ; un vétéran à 100 %. Les étoiles ne multiplient que le butin, donc la stratégie dominante est « toujours la zone la plus haute ».
2. **[équilibrage] Argent et réputation s'emballent, rien ne les dépense.** Simulation : ~800 p. au jour 10, ~4 600 au jour 15, ~40 000 au jour 30 ; réputation 26 au jour 15 (dernier palier à 28). Toutes les améliorations payables vers les jours 15–20.
3. **[bug] Une seule mort fait basculer l'armure dans l'ombre** (`coteArmure` teste `jaugeCamp < 0`).
4. **[bug] Le camp se scelle trop tôt (jour 14–15) et le sceau ne sert à rien** : `coteCamp` ignore `G.camp`.
5. **[équilibrage] La jauge est déséquilibrée et sans retour** : une mission d'ombre vaut −10,5 (−8 et `G.mal` compté en plus) contre +8 ; la somme n'est jamais bornée (à +200, il faut 13 missions d'ombre pour bouger l'aiguille).
6. **[bug] `G.mal` mélange deux choses** : les missions honnêtes en terres d'ombre comptent comme des « âmes offertes » (sabotages, accusations de la Faucheuse, Main Noire, compte faux au bureau).
7. **[histoire] Les quêtes d'ombre sont du mal pur** (« Piller une caravane de pèlerins », « Servir le mal ? Jamais ! ») : cela casse le retournement final.
8. **[histoire] Garrick disparaît après le tutoriel** (le premier indice prévu n'existe pas).
9. **[bug] Le bonneteau est un revenu sans risque** (mélange lisible, et quitter pendant le choix rembourse la mise).
10. **[équilibrage] La voie de la lumière ne rapporte presque rien** (Pèlerins ★2 : +14 p. de profit attendu ; Fleur +31, Pillage +46).
11. **[bug] Migrations de sauvegarde** : `G.reussites` remis à zéro au lieu d'être reconstruit depuis l'historique ; `Object.assign` écrase les objets imbriqués (faucheuse, stats, journal), leurs nouveaux sous-champs ne sont jamais complétés.
12. **[ergonomie] Le tutoriel s'arrête au matin du jour 2** : rien n'explique la Faucheuse, la banque, l'atelier, la jauge…
13. **[histoire] Le conseil et le dragon sont presque absents** des textes du jeu.
14. **[équilibrage] Le joueur peut se retrouver coincé** sans stock ni argent (un seul petit prêt à la fois).
15. **[ergonomie] Le flair trompe un enfant** (±35 % d'erreur au début).
16. **[histoire] Le GDD se contredit sur Garrick** (« grand méchant » contre « chef des vrais justes »).
17. **[ergonomie] Le sceau du camp tombe sans prévenir.**
18. **[ergonomie] La page « Lumière et ombre » du bureau est trop chargée.**
19. **[équilibrage] Mécaniques sans effet** : prêt de la Main Noire toujours moins bon que la banque ; une réparation au début fait perdre de l'argent ; mendiant, fontaine et chien ne produisent rien.
20. **[histoire] Le chien « se souvient de tout »** : le mendiant pourrait être quelqu'un que le sort d'oubli n'a pas touché.
21. **[histoire] Incohérences de texte** : « quatre jours de marche » pour une quête de 1–2 jours ; « Mastre Marché » ; la « Confrérie du Dernier Rempart » est-elle la Confrérie des Gardiens ?
22. **[ergonomie] Des lettres peuvent être refusées sans avoir pu y répondre** (le panneau du soir n'en montre que 4).

## Suivi
(mis à jour au fil des corrections)
- **Corrigés en v 0.54** :
  - 1 : malus de 0,08 par étoile au-delà de la première sur chaque épreuve (compensé par le bonus de niveau). Simulation : novice en mine ★3, 69 % de retour (contre ~95 %) ; l'IA « toujours la zone la plus haute » fait faillite une fois sur quatre.
  - 2 (en partie) : taxe hebdomadaire de la Confrérie « pour la défense contre le dragon » (12 / 16 / 22 % au-dessus de 200 p., selon le côté de la jauge). Simulation : ~15 000 p. au jour 30 au lieu de ~40 000. Reste à faire : réputation qui monte trop vite (44 au jour 30).
  - 3 : l'armure ne devient sombre qu'à partir du palier −1.
  - 4 : `coteCamp` respecte le camp scellé ; la 9e pièce n'arrive pas avant le jour 24 ; avertissement à la 8e pièce.
  - 5 : l'écart des réussites compte au plus pour 14 missions (la jauge peut toujours revenir) ; plus de double compte.
  - 6 : les missions en terres d'ombre ne touchent plus `G.mal` (migration : on retire 0,5 par mission d'ombre réussie des anciennes parties).
  - 7 : quêtes d'ombre réécrites (titres « officiels » du Conseil, récits qui disent autre chose : enfants gobelins enchaînés dans la caravane, reliques qui « étaient à son peuple, avant »).
  - 8 : visites de Garrick (étape 9d).
  - 9 : bonneteau : partir sans choisir fait perdre la mise ; plus de passes, plus vite à chaque partie du jour.
  - 11 : migration : objets imbriqués complétés avec les valeurs de départ ; réussites par camp reconstruites depuis l'historique.
  - 12 (en partie) : conseils de Garrick à la première visite de la banque, de l'atelier, de la page « Lumière et ombre », du marché noir.
  - 13 (en partie) : cinq nouvelles de la gazette sur le Conseil (Terres d'avant, taxe du dragon, âge du Sage, moine panda, fondations dans le Bourbier) ; murmures du marché noir.
  - 14 : coup de pouce de Garrick (provisions sur le pas de la porte) quand il ne reste ni argent ni stock, au plus tous les 15 jours.
  - 16 : GDD mis à jour (Garrick chef des Bannis).
  - 17 : avertissement à la 8e pièce d'armure.
  - 21 : textes corrigés (« Des jours de marche », « Marché des Mastres ») ; refus des terres d'ombre au nom du Conseil.
  - 22 : on peut feuilleter toutes les lettres le soir (le nombre sans réponse s'affiche en rouge).
- **Reportés** : 2 (réputation trop rapide), 10 (voie de la lumière peu rentable), 15 (flair), 18 (page Lumière et ombre trop chargée : à refaire avec le registre), 19 (Main Noire, réparations au début, mendiant/fontaine/chien), 20 (le mendiant et le sort d'oubli : à décider avec le joueur).
