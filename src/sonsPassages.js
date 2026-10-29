// (v1.65, la ville en quartiers, retours du joueur sur le socle) Les trois sons des passages d'un lieu à l'autre, dans
// l'esprit des Pokémon d'avant la Switch : courts, nets, un peu « jouet », jamais plus d'une demi-seconde. Ils sont
// synthétisés ici, note par note (aucun son repris d'un jeu) :
//   - passagePorte : la porte d'une maison, un petit « ploc » de bois qui s'ouvre (le loquet, le battant qui sonne
//     creux), puis se referme (un choc sourd, le loquet qui retombe) ;
//   - passageEscalier : un escalier, quatre petits pas de pierre qui descendent la gamme, et un souffle grave au bout ;
//   - passageSouffle : une sortie par le bord d'une rue ou d'une route, un léger souffle d'air qui passe.
// Ils sont fabriqués une fois, puis rejoués depuis le cache des bruitages (src/sonsRecits.js). Joués par
// fermerEnNoir (src/villeQuartiers.js), au moment où la vue se ferme.

const SONS_PASSAGES = {
  passagePorte(t, bus) {
    // le loquet qui se lève, puis le battant qui s'ouvre : un « ploc » de bois creux, qui descend
    this.bruitGlisse(t, 0.02, bus, { de: 2600, a: 2200, q: 3, volume: 0.22, attaque: 0.001 });
    this.tonGlisse(t + 0.012, 0.1, bus, { de: 640, a: 330, volume: 0.3, attaque: 0.003 });
    this.tonGlisse(t + 0.012, 0.07, bus, { forme: 'triangle', de: 1280, a: 720, volume: 0.05, attaque: 0.002 });
    this.bruitGlisse(t + 0.02, 0.08, bus, { de: 900, a: 600, q: 2, volume: 0.06, attaque: 0.004 });
    // la porte qui se referme derrière : un choc sourd, puis le loquet qui retombe, plus aigu
    this.tonGlisse(t + 0.24, 0.13, bus, { de: 230, a: 115, volume: 0.42, attaque: 0.002 });
    this.bruitGlisse(t + 0.24, 0.06, bus, { type: 'lowpass', de: 1000, a: 400, volume: 0.22, attaque: 0.001 });
    this.bruitGlisse(t + 0.272, 0.014, bus, { de: 3400, a: 3000, q: 3, volume: 0.12, attaque: 0.001 });
  },
  passageEscalier(t, bus) {
    // quatre pas rapides sur des marches de pierre, de plus en plus graves (on descend), puis un souffle sourd
    for (let i = 0; i < 4; i++) {
      const tp = t + i * 0.082, k = 1 - i * 0.11;
      this.tonGlisse(tp, 0.07, bus, { forme: 'triangle', de: 430 * k, a: 270 * k, volume: 0.16, attaque: 0.002, filtre: 1600 });
      this.tonGlisse(tp, 0.05, bus, { de: 150 * k, a: 85, volume: 0.18, attaque: 0.002 });
      this.bruitGlisse(tp, 0.03, bus, { de: 2000 * k, a: 1500 * k, q: 2, volume: 0.1, attaque: 0.001 });
    }
    this.bruitGlisse(t + 0.3, 0.2, bus, { type: 'lowpass', de: 700, a: 250, volume: 0.07, attaque: 0.04 });
    this.tonGlisse(t + 0.3, 0.2, bus, { de: 160, a: 80, volume: 0.08, attaque: 0.03 });
  },
  passageSouffle(t, bus) {
    // un léger souffle d'air : un bruit doux dont le filtre monte puis redescend, et un peu d'air plus aigu dessus
    this.bruitGlisse(t, 0.38, bus, { de: 520, par: 1900, a: 700, q: 0.9, volume: 0.13, attaque: 0.12, relache: 0.2 });
    this.bruitGlisse(t + 0.05, 0.28, bus, { de: 3400, a: 4600, q: 0.7, volume: 0.03, attaque: 0.1 });
  },
};
Object.assign(SONS, SONS_PASSAGES);
// (fabriqués une fois, puis rejoués depuis le cache ; le souffle en deux versions, pour ne pas lasser l'oreille)
Object.assign(SONS.passagePorte, { cache: { duree: 0.8 } });
Object.assign(SONS.passageEscalier, { cache: { duree: 0.9 } });
Object.assign(SONS.passageSouffle, { cache: { duree: 0.8, variantes: 2 } });
// (leur volume, mesuré au rendu : la porte et l'escalier au niveau des gestes du jeu, vers −22 dB ; le souffle plus
// discret, au niveau du petit son de passage d'avant, vers −30 dB)
Object.assign(VOLUME_SONS, { passagePorte: 0.62, passageEscalier: 1.25, passageSouffle: 1.3 });
