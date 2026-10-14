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
