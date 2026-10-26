// (v1.10, lot C-1, planches 38 et 38 v2 validées) Le Conseil des Gardiens : ses commandes scellées, et son impôt.
// Une fois par mois (dès ★2), le héraut de la Confrérie apporte une commande scellée : des provisions et des armes à
// livrer en 7 jours, contre une grosse prime et la faveur du Conseil. Ratée, elle coûte de la réputation, et l'impôt
// du Conseil est majoré pendant deux mois. L'impôt, lui, tombe le 1er de chaque mois.

const CONSEIL = {
  etoiles: 2,   // le Conseil s'intéresse à ton comptoir dès que s'ouvrent les contrées à 2 étoiles
  commande: {
    jourDuMois: 9,   // (la 2e semaine du mois : jamais un jour de fête ; la livraison tombe le 16)
    delai: 7,
    prime: 600, parEtoile: 0.5,   // 600 p. à ★2, +50 % par étoile
    reputation: 1,
    refus: 1,   // refuser : −1 de réputation (« ton comptoir a peur du travail »)
    echec: { reputation: 2, majoration: 1.5, mois: 2 },   // ratée : −2, impôt ×1,5 pendant 2 mois, pas de commande le mois suivant
  },
  impot: { taux: 0.05, franchise: 300, ristourne: 0.5, etalement: 14 },   // 5 % × étoiles au-delà de 300 p. × étoiles
  // (v1.13) l'échelle de la disgrâce : chaque commande manquée est une faute, chaque commande livrée en efface une.
  // L'impôt monte à chaque faute (un peu plus si tu penches vers les Bannis), sans jamais dépasser ×2 (×2,5 pour l'ombre).
  disgrace: {
    reputation: [2, 3, 3], majoration: [1.5, 1.75, 2], mois: [2, 3, 3],
    ombre: 0.25, plafond: { autre: 2, mal: 2.5 },
    pause: 2,              // mois sans commande après la 3e faute (puis vient la commande du pardon)
    refusDeSuite: 3,       // trois refus de suite : le Conseil ne propose plus rien pendant deux mois
    pardon: { quantite: 1.5, delai: 10 },
  },
};

// Les commandes, selon les étoiles : surtout ce qu'on trouve toujours au marché (rations, gourdes, torches,
// bandages, épées, capes), un peu de ce qui ne vient que certains jours ; dès que ta forge tourne, quelques armes
// « bel ouvrage » (sinon, des armes ordinaires suffisent)
const COMMANDES_ROYALES = {
  2: [
    { objets: { ration: 10, torche: 4, cape: 3 } },
    { objets: { ration: 8, gourde: 4, bandage: 5 } },
    { objets: { epee: 3, ration: 6, torche: 4 } },
    { objets: { bandage: 6, cape: 2, gourde: 4 } },
  ],
  3: [
    { objets: { epee: 4, ration: 10, cape: 3 }, bel: { epee: 2 } },
    { objets: { epee: 3, bouclier: 2, bandage: 6 }, bel: { epee: 2 } },
    { objets: { epee: 4, potion: 3, torche: 6 }, bel: { epee: 2 } },
  ],
  4: [
    { objets: { epee: 5, bouclier: 3, cape: 4, ration: 8 }, bel: { epee: 3 } },
    { objets: { epee: 4, antidote: 3, potion: 4, bandage: 6 }, bel: { epee: 2 } },
    { objets: { epee: 5, cape: 4, torche: 6, gourde: 5 }, bel: { epee: 3 } },
  ],
  5: [
    { objets: { epee: 6, bouclier: 4, cape: 4, potion: 4 }, bel: { epee: 4 } },
    { objets: { epee: 6, antidote: 4, bandage: 8, ration: 8 }, bel: { epee: 3 } },
  ],
};

POSTES.conseil = 'Commandes scellées'; POSTES.impot = 'Impôt du Conseil';

// Les noms des objets des commandes (singulier, pluriel, féminin) : « dix rations », « pas un seul bouclier »
const NOMS_ROYAUX = {
  ration: ['ration', 'rations', true], gourde: ['gourde', 'gourdes', true], torche: ['torche', 'torches', true],
  bandage: ['bandage', 'bandages', false], epee: ['épée', 'épées', true], cape: ['cape chaude', 'capes chaudes', true],
  bouclier: ['bouclier', 'boucliers', false], potion: ['potion', 'potions', true], antidote: ['antidote', 'antidotes', false],
  // (housekeep v1.14) tout ce que vendent les étals : les courses des petits en parlent chaque jour
  fleches: ['carquois de flèches', 'carquois de flèches', false], corde: ['corde', 'cordes', true], amulette: ['amulette', 'amulettes', true],
  hache: ['hache de guerre', 'haches de guerre', true], marteau: ['marteau de guerre', 'marteaux de guerre', false], arc: ['arc long', 'arcs longs', false],
  lance: ['lance', 'lances', true], baton: ['bâton de mage', 'bâtons de mage', false], bambou: ['bâton de bambou', 'bâtons de bambou', false],
  fronde: ['fronde', 'frondes', true], dague: ['dague', 'dagues', true], epeecourte: ['épée courte', 'épées courtes', true], arbalete: ['arbalète', 'arbalètes', true], rapiere: ['rapière', 'rapières', true], khopesh: ['khopesh', 'khopeshs', false],
  griffes: ['paire de griffes de fer', 'paires de griffes de fer', true], massue: ['massue', 'massues', true],
};
const EN_LETTRES = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf', 'vingt'];
function nomRoyal(id, n = 1) { const t = NOMS_ROYAUX[id] || [nomObjet(id).toLowerCase(), nomObjet(id).toLowerCase() + 's', false]; return n > 1 ? t[1] : t[0]; }
function femininRoyal(id) { return !!(NOMS_ROYAUX[id] || [])[2]; }
function enLettres(n, feminin = false) { return n === 1 && feminin ? 'une' : EN_LETTRES[n] || String(n); }
const majuscule = t => t.charAt(0).toUpperCase() + t.slice(1);
// « Quatre épées, dix rations et trois capes chaudes »
function objetsRoyaux(objets) {
  const l = Object.entries(objets).map(([id, n]) => `${enLettres(n, femininRoyal(id))} ${nomRoyal(id, n)}`);
  return majuscule(l.length > 1 ? l.slice(0, -1).join(', ') + ' et ' + l[l.length - 1] : l[0] || '');
}

function etoilesDe(G) { return Math.max(1, ...(G.paliersEtoiles || [1])); }
function conseilDe(G) { return (G.conseil = G.conseil || {}); }
function forgeQuiTourne(G) { return !!(G.forge && G.forge.construite && (G.forge.aldo || G.forge.baba)); }
function primeRoyale(G) { return Math.round(CONSEIL.commande.prime * (1 + CONSEIL.commande.parEtoile * (Math.min(5, etoilesDe(G)) - 2))); }

// La commande du mois : tirée la nuit (donc sauvegardée : recharger ne la change pas)
function tirerCommandeRoyale(G) {
  const et = Math.min(5, etoilesDe(G));
  const modele = auHasard(COMMANDES_ROYALES[et] || COMMANDES_ROYALES[2]);
  const objets = { ...modele.objets };
  // (jamais plus que ce que ta réserve peut garder, avec un peu de place pour tes clients)
  const place = Math.max(8, (G.capacite || RESERVE_DEPART) - 4), total = Object.values(objets).reduce((a, n) => a + n, 0);
  if (total > place) for (const id of Object.keys(objets)) objets[id] = Math.max(1, Math.floor(objets[id] * place / total));
  // (relecture v1.10) jamais plus de « bel ouvrage » que ta forge ne peut en sortir pendant le délai (avec un peu de
  // marge), plus ceux que tu as déjà : Aldo apprenti seul n'en fait presque jamais, Baba souvent
  const bel = {};
  if (forgeQuiTourne(G) && modele.bel) {
    const f = G.forge, ra = rangAldo(G) || FORGE.rangsAldo[0], taux = (f.baba ? FORGE.forgerons.baba.vitesse * FORGE.forgerons.baba.belOuvrage : 0) + (f.aldo ? ra.vitesse * ra.belOuvrage : 0);
    for (const [id, n] of Object.entries(modele.bel)) {
      const possible = Math.floor(((G.belOuvrage || {})[id] || 0) + taux * CONSEIL.commande.delai * 0.6);
      const k = Math.min(n, objets[id] || 0, possible);
      if (k > 0) bel[id] = k;
    }
  }
  // (v1.13) dans la disgrâce : la commande du pardon, plus grosse, plus longue, sans prime
  if (conseilDe(G).disgrace) {
    const P = CONSEIL.disgrace.pardon;
    for (const id of Object.keys(objets)) objets[id] = Math.ceil(objets[id] * P.quantite);
    const t2 = Object.values(objets).reduce((a, n) => a + n, 0), place2 = Math.max(10, (G.capacite || RESERVE_DEPART) - 2);
    if (t2 > place2) for (const id of Object.keys(objets)) objets[id] = Math.max(1, Math.floor(objets[id] * place2 / t2));
    return { etat: 'proposee', jour: G.jour, limite: G.jour + P.delai, objets, bel, prime: 0, pardon: true };
  }
  return { etat: 'proposee', jour: G.jour, limite: G.jour + CONSEIL.commande.delai, objets, bel, prime: primeRoyale(G) };
}

// Les « bel ouvrage » promis au Conseil : ils ne partent pas dans les baluchons (voir belOuvrageAuDepart)
function belOuvrageReserve(G, id) {
  const c = G.commandeRoyale;
  return c && c.etat === 'acceptee' ? (c.bel || {})[id] || 0 : 0;
}

// Ce qui manque encore : une ligne par objet (ce qu'il faut, ce que tu as, dont « bel ouvrage »)
function etatCommandeRoyale(G, c = G.commandeRoyale) {
  if (!c) return null;
  const lignes = Object.entries(c.objets).map(([id, n]) => {
    // (`pret` : ce qui compte vraiment, les « bel ouvrage » demandés d'abord, puis le reste en armes ordinaires)
    const b = (c.bel || {})[id] || 0, a = G.stock[id] || 0, aBel = Math.min(a, b, (G.belOuvrage || {})[id] || 0);
    const pret = aBel + Math.min(a - aBel, n - b);
    return { id, n, a: Math.min(a, n), bel: b, aBel, pret, complet: pret >= n };
  });
  return { lignes, complet: lignes.every(l => l.complet), joursRestants: Math.max(0, c.limite - G.jour) };
}

function accepterCommandeRoyale(G) {
  const c = G.commandeRoyale;
  if (!c || c.etat !== 'proposee') return false;
  c.etat = 'acceptee';
  conseilDe(G).refusDeSuite = 0;
  return true;
}

function refuserCommandeRoyale(G) {
  const c = G.commandeRoyale;
  if (!c || c.etat !== 'proposee') return false;
  G.reputation -= CONSEIL.commande.refus;
  G.commandeRoyale = null;
  // (v1.13) trois refus de suite : le Conseil cesse de proposer pendant deux mois (refuser n'est pas une faute)
  const cs = conseilDe(G), D = CONSEIL.disgrace;
  cs.refusDeSuite = (cs.refusDeSuite || 0) + 1;
  if (cs.refusDeSuite >= D.refusDeSuite) { cs.refusDeSuite = 0; cs.sansCommandeAvant = G.jour + D.pause * JOURS_PAR_MOIS + 1; return { ok: true, pause: true }; }   // (+1 : le jour des deux mois tombe sur un jour de commande)
  return { ok: true };
}

// Le jour dit, le héraut repasse : tout y est (prime, réputation, ristourne sur l'impôt), ou c'est l'échec
function livrerCommandeRoyale(G) {
  const c = G.commandeRoyale;
  if (!c || c.etat !== 'acceptee') return null;
  const e = etatCommandeRoyale(G);
  if (!e.complet) return { ok: false, ...echecCommandeRoyale(G), manque: e.lignes.filter(l => !l.complet) };
  for (const [id, n] of Object.entries(c.objets)) {
    const b = (c.bel || {})[id] || 0;
    // (on prend d'abord les armes ordinaires, puis le « bel ouvrage » demandé : le reste de tes belles pièces te reste)
    G.stock[id] -= n;
    if (G.belOuvrage && G.belOuvrage[id]) {
      const ordinaires = (G.stock[id] + n) - G.belOuvrage[id], prisesBelles = Math.max(b, n - Math.max(0, ordinaires));
      G.belOuvrage[id] = Math.max(0, Math.min(G.stock[id], G.belOuvrage[id] - prisesBelles));
    }
  }
  const cs = conseilDe(G);
  if (c.prime) encaisser(G, c.prime, 'conseil');
  G.reputation += CONSEIL.commande.reputation;
  cs.ristourne = true;
  cs.reussies = (cs.reussies || 0) + 1;
  if (typeof pieceConseil === 'function') pieceConseil(G);   // (v1.23) le Conseil te confie une relique pour ta vitrine
  cs.refusDeSuite = 0;
  // (v1.13) une commande livrée efface une faute ; celle du pardon les efface toutes, et rend le sceau
  const pardon = !!c.pardon;
  if (pardon) { cs.fautes = 0; cs.disgrace = false; cs.majoreJusqua = 0; }
  else cs.fautes = Math.max(0, (cs.fautes || 0) - 1);
  G.commandeRoyale = null;
  if (pardon) { const premier = cs.reussies === 1; G.annonceConseil = `Le Conseil des Gardiens pardonne à « ${G.nomShop} » : la commande du pardon est livrée, et le sceau du Conseil ${premier ? 'orne enfin sa porte' : 'retrouve sa place à sa porte'}.`; return { ok: true, prime: 0, pardon: true, premierSceau: premier }; }
  G.annonceConseil = `Le Conseil des Gardiens salue « ${G.nomShop} » : sa commande scellée est arrivée à temps, jusqu'${femininRoyal(Object.keys(c.objets)[0]) ? 'à la dernière' : 'au dernier'} ${nomRoyal(Object.keys(c.objets)[0])}.`;
  return { ok: true, prime: c.prime };
}

// L'échec : une faute de plus sur l'échelle de la disgrâce (v1.13).
// 1re : −2, impôt ×1,5 pendant 2 mois, pas de commande le mois suivant. 2e : le sceau noir, −3, impôt ×1,75 pendant
// 3 mois, et le paon d'à côté reçoit tes commandes (sa pression monte). 3e : la disgrâce, −3, impôt ×2 pendant 3 mois,
// plus de nobles au comptoir ni de commande pendant deux mois, puis la commande du pardon. Penché vers les Bannis :
// l'impôt monte d'un quart de plus à chaque faute (jamais plus de ×2,5).
function majorationDeFaute(G, f) {
  const D = CONSEIL.disgrace, i = Math.min(f, 3) - 1, mal = coteCamp(G) === 'mal';
  return Math.min(mal ? D.plafond.mal : D.plafond.autre, D.majoration[i] + (mal ? D.ombre * f : 0));
}
function echecCommandeRoyale(G) {
  const D = CONSEIL.disgrace, cs = conseilDe(G), c = G.commandeRoyale || {};
  const pardonRate = !!c.pardon;
  cs.fautes = pardonRate ? Math.max(3, cs.fautes || 3) : (cs.fautes || 0) + 1;
  const f = Math.min(3, cs.fautes), i = f - 1;
  const reputation = D.reputation[i], majoration = majorationDeFaute(G, f), mois = D.mois[i];
  G.reputation -= reputation;
  cs.majoration = majoration;
  cs.majoreJusqua = G.jour + mois * JOURS_PAR_MOIS;
  cs.ratees = (cs.ratees || 0) + 1;
  let rival = false;
  if (f >= 2 && typeof rivalOuvert === 'function' && rivalOuvert(G) && G.rival.pression < RIVAL.pression.max) { G.rival.pression++; rival = true; }
  if (f >= 3) { cs.disgrace = true; cs.sansCommandeAvant = G.jour + D.pause * JOURS_PAR_MOIS; }
  else cs.sansCommandeAvant = G.jour + JOURS_PAR_MOIS;
  G.commandeRoyale = null;
  G.annonceConseil = f >= 3 ? `Disgrâce ! Le Conseil des Gardiens ${(cs.reussies || 0) > 0 ? 'retire son sceau de la porte de' : 'tourne le dos à'} « ${G.nomShop} » : ${pardonRate ? 'même la commande du pardon' : 'une troisième commande scellée'} n'est jamais arrivée.`
    : f === 2 ? `Le Conseil des Gardiens envoie le sceau noir à « ${G.nomShop} » : une deuxième commande scellée manquée.${rival ? ' Ses commandes iront désormais « Au Comptoir Agréé ».' : ''}`
      : `On dit que « ${G.nomShop} » a fait faux bond au Conseil des Gardiens : sa commande scellée n'est jamais arrivée.`;
  return { reputation, majoration, mois, fautes: f, rival, disgrace: f >= 3, pardonRate, ombre: coteCamp(G) === 'mal', avaitSceau: (cs.reussies || 0) > 0 };
}
// Le sceau du Conseil à ta porte : accroché à ta première commande livrée, décroché dans la disgrâce
function sceauALaPorte(G) { const cs = G.conseil || {}; return (cs.reussies || 0) > 0 && !cs.disgrace; }
function enDisgrace(G) { return !!(G.conseil && G.conseil.disgrace); }

// L'impôt du mois : 5 % × étoiles de ce que tu as au-delà de la franchise (l'argent emprunté n'est pas taxé),
// divisé par deux après une commande livrée, majoré après une commande manquée (les deux peuvent se suivre)
function calculImpot(G) {
  const et = Math.min(5, etoilesDe(G)), I = CONSEIL.impot, cs = conseilDe(G);
  const dettes = G.prets.reduce((s, p) => s + p.restant, 0);
  const fortune = Math.max(0, Math.round(G.argent - dettes)), franchise = I.franchise * et;
  const majore = (cs.majoreJusqua || 0) >= G.jour, ristourne = !!cs.ristourne;
  const majoration = majore ? (cs.majoration || CONSEIL.commande.echec.majoration) : 1;
  const taux = I.taux * et * majoration * (ristourne ? I.ristourne : 1);
  const reliques = typeof multImpotCollection === 'function' ? multImpotCollection(G) : 1;   // (v1.23 : les reliques du Conseil, −10 %)
  const montant = Math.round(Math.max(0, fortune - franchise) * taux * reliques);
  return { et, fortune, dettes: Math.round(dettes), franchise, tauxBase: I.taux * et, taux, majore, majoration, ristourne, reliques, montant };
}

function payerImpotDuConseil(G) {
  const c = calculImpot(G), cs = conseilDe(G);
  cs.ristourne = false;
  let dette = 0;
  if (c.montant > 0) {
    // (jamais la faillite pour l'impôt : ce que tu ne peux pas payer devient une dette envers le Conseil)
    const paye = Math.min(c.montant, Math.max(0, Math.floor(G.argent) - 20));
    if (paye > 0) payer(G, paye, 'impot');
    dette = c.montant - paye;
    if (dette > 0) {
      const p = G.prets.find(x => x.id === 'conseil');
      if (p) { p.restant += dette; p.parJour = Math.ceil(p.restant / CONSEIL.impot.etalement); }
      else G.prets.push({ id: 'conseil', preteur: 'Le Conseil des Gardiens', nom: "Arriéré d'impôt", restant: dette, parJour: Math.ceil(dette / CONSEIL.impot.etalement) });
    }
  }
  G.lettreImpot = { jour: G.jour, ...c, dette, vue: false, premiere: !cs.lettres };
  cs.lettres = (cs.lettres || 0) + 1;
  // (après une commande ratée, le mois suivant est-il encore majoré ?)
  G.lettreImpot.encoreMajore = (cs.majoreJusqua || 0) >= G.jour + JOURS_PAR_MOIS;
  return G.lettreImpot;
}

// La lettre du percepteur, à l'ouverture du comptoir (la toute première, même s'il n'y a rien à payer : on apprend)
function lettreImpotDuJour(G) {
  const l = G.lettreImpot;
  return !!(l && l.jour === G.jour && !l.vue && (l.montant > 0 || l.premiere));
}

// Le héraut, le jour dit, devant une commande incomplète : « Deux épées sur quatre ? Et pas une seule cape ? »
function reprocheRoyal(manque) {
  return manque.slice(0, 2).map((l, i) => {
    const f = femininRoyal(l.id);
    const p = l.aBel < l.bel && l.a > l.aBel ? `Des ${nomRoyal(l.id, 2)} ordinaires, là où le Conseil voulait du « bel ouvrage » ?`
      : l.pret === 0 ? `Pas ${f ? 'une seule' : 'un seul'} ${nomRoyal(l.id)} ?`
        : `${majuscule(enLettres(l.pret, f))} ${nomRoyal(l.id, l.pret)} sur ${enLettres(l.n, f)} ?`;
    return i ? 'Et ' + p.charAt(0).toLowerCase() + p.slice(1) : p;
  }).join(' ');
}

// Avant le changement de jour : une commande acceptée dont le jour est passé (le héraut n'a trouvé personne, ou tu
// as fermé avant sa venue) est ratée ; une commande jamais lue s'en va sans bruit
function echeancesDuConseil(G) {
  const c = G.commandeRoyale;
  if (!c) return;
  if (c.etat === 'acceptee' && G.jour >= c.limite) echecCommandeRoyale(G);
  else if (c.etat === 'proposee' && G.jour >= c.jour) G.commandeRoyale = null;
}

// Au matin : l'impôt le 1er du mois, la commande scellée le 9 (dès ★2). Renvoie les lignes du réveil.
function matinDuConseil(G) {
  const lignes = [];
  if (etoilesDe(G) < CONSEIL.etoiles) return lignes;
  const d = dateDuJour(G), cs = conseilDe(G);
  if (d.jourDuMois === 1 && cs.impotJour !== G.jour) {
    cs.impotJour = G.jour;
    const l = payerImpotDuConseil(G);
    if (l.montant > 0) lignes.push(`Le percepteur du Conseil est passé : ${pluriel(l.montant, "pièce d'impôt", "pièces d'impôt")} pour le mois${l.majore ? ` (majoré : ${(cs.fautes || 0) >= 3 ? 'la disgrâce' : (cs.fautes || 0) >= 2 ? 'le sceau noir' : 'ta commande scellée ratée'}${l.ristourne ? ', puis divisé par deux : ta dernière commande livrée' : ''})` : l.ristourne ? ' (moitié prix : ta commande scellée réussie)' : ''}.${l.dette ? ` Il te manquait ${pluriel(l.dette, 'pièce', 'pièces')} : une dette envers le Conseil.` : ''}`);
  }
  // (le rappel du matin : ce qui manque encore, avant d'aller au marché)
  const c = G.commandeRoyale;
  if (c && c.etat === 'acceptee' && G.jour <= c.limite) {
    const e = etatCommandeRoyale(G), j = c.limite - G.jour;
    const manque = e.lignes.filter(l => !l.complet).map(l => {
      const belManque = l.bel - l.aBel, ordinaires = Math.max(0, (l.n - l.bel) - (l.pret - l.aBel));
      const parts = [];
      if (ordinaires > 0) parts.push(`${ordinaires} ${nomRoyal(l.id, ordinaires)}`);
      if (belManque > 0) parts.push(`${belManque} ${nomRoyal(l.id, belManque)} « bel ouvrage »`);
      return parts.join(' et ');
    });
    const quand = j === 0 ? 'ce matin' : j === 1 ? 'demain matin' : `le jour ${c.limite}`;
    lignes.push(manque.length ? `Commande scellée du Conseil : il manque encore ${manque.length > 1 ? manque.slice(0, -1).join(', ') + ' et ' + manque[manque.length - 1] : manque[0]}. Le héraut repasse ${quand}.`
      : `Commande scellée du Conseil : tout est prêt. Le héraut repasse ${quand}.`);
  }
  if (d.jourDuMois === CONSEIL.commande.jourDuMois && !G.commandeRoyale && (cs.sansCommandeAvant || 0) <= G.jour && !G.faillite) {
    G.commandeRoyale = tirerCommandeRoyale(G);
  }
  return lignes;
}

// Dans la file du jour : le héraut vient apporter la commande, ou la chercher (en tête des visites)
function visitesDuConseil(G) {
  const c = G.commandeRoyale;
  if (!c) return [];
  if (c.etat === 'proposee' && c.jour === G.jour) return [{ type: 'heraut', mode: 'commande' }];
  if (c.etat === 'acceptee' && c.limite === G.jour) return [{ type: 'heraut', mode: 'livraison' }];
  return [];
}
