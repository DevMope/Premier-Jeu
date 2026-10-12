# Le Comptoir des Aventuriers

Jeu de gestion narratif en pixel art : tu tiens un comptoir de ravitaillement pour aventuriers et tu investis dans leurs chances de revenir vivants.

## Jouer

- **En ligne** : la version publiée sur claude.ai : https://claude.ai/artifact/XWpWBKAFKkiutdxrEcnjqU
- **En local** : ouvre `index.html` dans ton navigateur (double-clic). Aucune installation n'est nécessaire, et ça marche même sans internet.

`web/jeu.html` est l'enveloppe de la version en ligne : elle charge les mêmes fichiers que `index.html`.

## Organisation du code

| Fichier | Rôle |
|---|---|
| `src/data.js` | Objets, stock, voyageurs, quêtes et calcul des chances |
| `src/pixels.js` | Dessins en pixel art et petits outils d'interface |
| `src/scenes/TitleScene.js` | Écran titre |
| `src/scenes/CounterScene.js` | Le comptoir : servir les voyageurs |
| `src/scenes/NightScene.js` | La nuit : le temps passe |
| `src/scenes/StoryScene.js` | La cinématique du récit de chaque aventurier |
| `src/scenes/BilanScene.js` | Le bilan de la journée |
| `lib/phaser.min.js` | Le moteur de jeu [Phaser](https://phaser.io) 3.80.1 (licence MIT) |

Le document de conception est dans [docs/game-design.md](docs/game-design.md).
