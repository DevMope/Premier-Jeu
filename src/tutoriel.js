// La première journée : Garrick Cœur-de-Chêne reste à tes côtés et t'explique chaque écran,
// la première fois que tu le découvres. Un conseil ne s'affiche qu'une fois (G.tutoVu).

const CONSEILS = {
  carte: "Le matin, des aventuriers cherchent l'aventure sans savoir où aller. Clique sur un voyageur en bas, puis sur une contrée de la carte. Les étoiles disent le danger : n'envoie pas un novice dans une contrée à trois étoiles !",
  comptoir: "Un client ! Sa commande est sur le parchemin, à droite. Clique sur tes marchandises, en bas, pour les glisser dans son baluchon. Mieux il est équipé, plus il a de chances de revenir... et de te reverser sa part du butin.",
  colis: "Bien ! Quand le baluchon est prêt, clique sur « Remettre le baluchon ». Ton flair, sous la commande, t'indique ses chances de revenir vivant.",
  remis: "Le voilà parti ! Dans quelques jours, il reviendra te raconter son aventure (si tout va bien...). Occupe-toi du suivant : la file attend.",
  refus: "Aïe : il te manque de quoi l'équiper entièrement. L'envoyer à moitié préparé, c'est risquer sa vie... Si tu juges que c'est trop dangereux, clique sur « Refuser ce client » : il repartira, et ta réputation baissera un peu. Mieux vaut un client déçu qu'un client mort !",
  arriere: "Ton arrière-boutique : ta réserve sur les étagères, ta fortune près du coffre, les cadeaux dans le panier. La porte, au fond, mène à ta chambre quand la journée est finie.",
  soir: "La journée est finie. Le soir, réponds aux lettres (des clients qui viendront plus tard), surveille ta réserve, et passe au bureau : c'est là qu'on améliore le shop. Puis va dormir !",
  bureau: "Le registre : toutes les fiches de tes clients. À droite, l'ardoise de tes comptes, et des tiroirs. Le premier, « Améliorer le shop », fait venir les ouvriers pendant la nuit.",
  marche: "Le Marché des Mastres ! Chaque matin, viens y racheter de quoi remplir ta réserve. Chaque marchand a ses prix du jour. Clique sur un lieu pour t'en approcher, puis « ◀ Le marché » pour reculer. Il y a aussi le Bazar (des cadeaux), les enchères, les jeux, et le crieur qui annonce les nouvelles du jour... Moi, je reprends la route. Bonne chance, l'ami !",
};

// Affiche le conseil `cle` de Garrick, si c'est la première fois (et si le tutoriel est actif).
function conseilGarrick(scene, cle) {
  const G = window.GAME;
  if (!G || !G.tuto || !CONSEILS[cle]) return;
  G.tutoVu = G.tutoVu || {};
  if (G.tutoVu[cle]) return;
  G.tutoVu[cle] = true;
  if (cle === 'marche') G.tuto = false; // le dernier conseil : Garrick s'en va
  const c = scene.add.container(0, 0).setDepth(60);
  c.add(scene.add.rectangle(480, 270, 960, 540, 0x000000, 0.35).setInteractive());
  c.add(scene.add.image(560, 420, panneauHD(scene, 700, 170)).setScale(2));
  c.add(imageCorps(scene, 150, 520, 'mentor', 9));
  c.add(scene.add.text(240, 348, 'Garrick Cœur-de-Chêne', style(16, '#7a5a10', { fontStyle: 'bold' })));
  c.add(scene.add.text(240, 372, `« ${CONSEILS[cle]} »`, style(14, '#3b2410', { wordWrap: { width: 610 }, lineSpacing: 3 })));
  const b = creerBouton(scene, 820, 482, 150, 'Compris !', () => {
    scene.tweens.add({ targets: c, alpha: 0, duration: 200, onComplete: () => c.destroy() });
  });
  b.label.setFontSize(15);
  c.add([b.fond, b.label]);
  c.setAlpha(0);
  scene.tweens.add({ targets: c, alpha: 1, duration: 250 });
}
