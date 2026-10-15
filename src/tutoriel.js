// La première journée : Garrick Cœur-de-Chêne reste à tes côtés et t'explique chaque écran,
// la première fois que tu le découvres. Un conseil ne s'affiche qu'une fois (G.tutoVu).

const CONSEILS = {
  carte: "Le matin, des aventuriers cherchent l'aventure sans savoir où aller. Clique sur un voyageur en bas, puis sur une contrée de la carte. Les étoiles disent le danger : chaque étoile rend chaque épreuve plus dure, et un novice rentre souvent blessé d'une contrée à trois étoiles !",
  // Les conseils d'après le premier jour : Garrick n'est plus là, mais ses mots restent (une fois chacun)
  banque: "La Banque Centrale, chez les nains. Un prêt, ça dépanne, mais la banque prélève chaque nuit. Ne prends que ce que tu peux rendre, petit.",
  atelier: "L'atelier : les trouvailles que les aventuriers te laissent. Répare-les, et revends-les plus cher aux enchères. Un objet cassé ne vaut presque rien.",
  jauge: "La lumière et l'ombre : ce que le monde pense de toi. Les gens aiment les cases bien rangées, hein ? Ha ! Regarde surtout ce que ça change pour ton comptoir.",
  marcheNoir: "Tu te souviens de ce que je t'avais dit ? La nuit, les honnêtes gens ont aussi leurs marchés. Sois prudent : chaque affaire fait du bruit, et la garde a de bonnes oreilles.",
  comptoir: "Un client ! Sa commande est sur le parchemin, à droite. Clique sur tes marchandises, en bas, pour les glisser dans son baluchon. Mieux ton client est équipé, plus il a de chances de revenir... et de te reverser sa part du butin.",
  colis: "Bien ! Quand le baluchon est prêt, clique sur « Remettre le baluchon ». Ton flair, sous la commande, t'indique ses chances de revenir vivant.",
  remis: "Et un baluchon de parti ! Ton client reviendra te raconter son aventure, dès demain pour une course courte (si tout va bien...). Occupe-toi du suivant : la file attend.",
  refus: "Aïe : il te manque de quoi l'équiper entièrement. L'envoyer à moitié préparé, c'est risquer sa vie... Si tu juges que c'est trop dangereux, clique sur « Refuser ce client » : il repartira, et ta réputation baissera un peu. Mieux vaut un client déçu qu'un client mort !",
  arriere: "Ton arrière-boutique : ta réserve sur les étagères, ta fortune près du coffre, les cadeaux dans le panier. La porte, au fond, mène à ta chambre quand la journée est finie.",
  soir: "La journée est finie. Le soir, réponds aux lettres (des clients qui viendront plus tard), surveille ta réserve, et passe au bureau : c'est là qu'on améliore le comptoir. Puis va dormir !",
  bureau: "Le registre : toutes les fiches de tes clients. À droite, l'ardoise de tes comptes, et des tiroirs. Le premier, « Améliorer le comptoir », fait venir les ouvriers pendant la nuit.",
  marche: "Le Marché des Mastres ! Chaque matin, rachète ici de quoi remplir ta réserve : chaque marchand a ses prix du jour, et ses étals changent d'un matin à l'autre : ce qui manque aujourd'hui sera peut-être là demain. Clique sur un lieu pour t'en approcher. Il y a aussi le Bazar, les enchères, les jeux et le crieur... Moi, je reprends la route. Bonne chance !",
};

// Affiche le conseil `cle` de Garrick, si c'est la première fois (et si le tutoriel est actif).
// `toujours` : un conseil des mécaniques d'après le premier jour (il s'affiche même après le tutoriel)
function conseilGarrick(scene, cle, toujours = false) {
  const G = window.GAME;
  if (!G || (!G.tuto && !toujours) || !CONSEILS[cle]) return;
  G.tutoVu = G.tutoVu || {};
  if (G.tutoVu[cle]) return;
  G.tutoVu[cle] = true;
  if (cle === 'marche') G.tuto = false; // le dernier conseil : Garrick s'en va
  // (v0.59) fixé à l'écran, même quand la caméra a défilé (le marché noir et ses trois coins)
  const c = scene.add.container(0, 0).setDepth(60).setScrollFactor(0, 0, true);
  c.add(scene.add.rectangle(480, 270, 960, 540, 0x000000, 0.35).setInteractive());
  c.add(scene.add.image(560, 420, panneauHD(scene, 700, 170)).setScale(2));
  c.add(imageCorps(scene, 150, 520, 'mentor', 9));
  c.add(scene.add.text(240, 348, 'Garrick Cœur-de-Chêne', style(16, '#7a5a10', { fontStyle: 'bold' })));
  // (v0.68) une écriture plus lisible (plus grande, plus foncée, droite) qui s'écrit lettre après
  // lettre ; un premier clic sur « Compris ! » affiche tout, le second ferme
  const texte = scene.add.text(240, 372, '', style(16, '#24140a', { wordWrap: { width: 610 }, lineSpacing: 4 }));
  c.add(texte);
  let defile = null;
  scene.time.delayedCall(260, () => { if (texte.active) defile = texteQuiDefile(scene, texte, `« ${CONSEILS[cle]} »`, { vitesse: 18 }); });
  const b = creerBouton(scene, 820, 482, 150, 'Compris !', () => {
    if (defile && defile.enCours()) return defile.finir();
    scene.tweens.add({ targets: c, alpha: 0, duration: 200, onComplete: () => c.destroy() });
  });
  b.label.setFontSize(15);
  c.add([b.fond, b.label]);
  c.setAlpha(0);
  // (sur la carte, le monde est filmé par sa propre caméra, par-dessus la caméra principale :
  // le conseil va dans le calque de l'interface, filmé en dernier, pour rester au-dessus)
  if (scene.dessus && scene.camDessus) scene.dessus.add(c);
  scene.tweens.add({ targets: c, alpha: 1, duration: 250 });
}
