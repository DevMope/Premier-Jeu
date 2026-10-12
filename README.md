# Le Comptoir des Aventuriers

Jeu de gestion narratif en pixel art : tu tiens un comptoir de ravitaillement pour aventuriers et tu investis dans leurs chances de revenir vivants.

## Jouer

- **En ligne** : la version publiée sur claude.ai : https://claude.ai/artifact/XWpWBKAFKkiutdxrEcnjqU
- **En local** : ouvre `index.html` dans ton navigateur (double-clic). Aucune installation n'est nécessaire, et ça marche même sans internet.

`web/jeu.html` est l'enveloppe de la version en ligne : elle charge les mêmes fichiers que `index.html`.

## Organisation du code

| Fichier | Rôle |
|---|---|
| `src/data.js` | Le contenu : objets et prix, modèles de quêtes, noms des aventuriers |
| `src/regles.js` | Les règles : chances de retour, aventures, journées, lettres, prévision des clients |
| `src/pixels.js` | Dessins en pixel art et petits outils d'interface |
| `src/scenes/Cinematique.js` | Base commune des cinématiques (texte, clic pour continuer, animations) |
| `src/scenes/TitleScene.js` | Écran titre |
| `src/scenes/IntroScene.js` | Création du personnage et cinématique d'introduction |
| `src/scenes/CounterScene.js` | Le comptoir : servir les voyageurs |
| `src/scenes/MarcheScene.js` | Le Mastre Marché, le matin : étals, jeux d'argent, mendiant |
| `src/scenes/NightScene.js` | Le soir : bilan, réserve, lettres, banque, prévision de demain |
| `src/scenes/StoryScene.js` | La cinématique du récit de chaque aventurier |
| `src/scenes/FailliteScene.js` | La cinématique de faillite |
| `src/scenes/ExpressScene.js` | La caravane du Vieux Grippesou, le marchand express |
| `src/scenes/BanqueScene.js` | La banque naine |
| `lib/phaser.min.js` | Le moteur de jeu [Phaser](https://phaser.io) 3.80.1 (licence MIT) |

Le document de conception est dans [docs/game-design.md](docs/game-design.md).
