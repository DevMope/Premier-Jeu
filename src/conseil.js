// (v1.10, lot C-1, planches 38 et 38 v2 validées) Le Conseil des Gardiens : ses commandes royales, et son impôt.
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

POSTES.conseil = 'Commandes royales'; POSTES.impot = 'Impôt du Conseil';

// Les noms des objets des commandes (singulier, pluriel, féminin) : « dix rations », « pas un seul bouclier »
const NOMS_ROYAUX = {
  ration: ['ration', 'rations', true], gourde: ['gourde', 'gourdes', true], torche: ['torche', 'torches', true],
  bandage: ['bandage', 'bandages', false], epee: ['épée', 'épées', true], cape: ['cape chaude', 'capes chaudes', true],
  bouclier: ['bouclier', 'boucliers', false], potion: ['potion', 'potions', true], antidote: ['antidote', 'antidotes', false],
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
  return true;
}

function refuserCommandeRoyale(G) {
  const c = G.commandeRoyale;
  if (!c || c.etat !== 'proposee') return false;
  G.reputation -= CONSEIL.commande.refus;
  G.commandeRoyale = null;
  return true;
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
  encaisser(G, c.prime, 'conseil');
  G.reputation += CONSEIL.commande.reputation;
  conseilDe(G).ristourne = true;
  conseilDe(G).reussies = (conseilDe(G).reussies || 0) + 1;
  G.commandeRoyale = null;
  G.annonceConseil = `Le Conseil des Gardiens salue « ${G.nomShop} » : sa commande royale est arrivée à temps, jusqu'${femininRoyal(Object.keys(c.objets)[0]) ? 'à la dernière' : 'au dernier'} ${nomRoyal(Object.keys(c.objets)[0])}.`;
  return { ok: true, prime: c.prime };
}

// L'échec : moins de réputation, l'impôt majoré deux mois, pas de commande le mois suivant
function echecCommandeRoyale(G) {
  const E = CONSEIL.commande.echec, cs = conseilDe(G);
  G.reputation -= E.reputation;
  cs.majoreJusqua = G.jour + E.mois * JOURS_PAR_MOIS;
  cs.sansCommandeAvant = G.jour + JOURS_PAR_MOIS;
  cs.ratees = (cs.ratees || 0) + 1;
  G.commandeRoyale = null;
  G.annonceConseil = `On dit que « ${G.nomShop} » a fait faux bond au Conseil des Gardiens : sa commande royale n'est jamais arrivée.`;
  return { reputation: E.reputation, majoration: E.majoration, mois: E.mois };
}

// L'impôt du mois : 5 % × étoiles de ce que tu as au-delà de la franchise (l'argent emprunté n'est pas taxé),
// moitié prix après une commande réussie, ×1,5 après une commande ratée
function calculImpot(G) {
  const et = Math.min(5, etoilesDe(G)), I = CONSEIL.impot, cs = conseilDe(G);
  const dettes = G.prets.reduce((s, p) => s + p.restant, 0);
  const fortune = Math.max(0, Math.round(G.argent - dettes)), franchise = I.franchise * et;
  const majore = (cs.majoreJusqua || 0) >= G.jour, ristourne = !!cs.ristourne;
  const taux = I.taux * et * (majore ? CONSEIL.commande.echec.majoration : 1) * (ristourne ? I.ristourne : 1);
  const montant = Math.round(Math.max(0, fortune - franchise) * taux);
  return { et, fortune, dettes: Math.round(dettes), franchise, tauxBase: I.taux * et, taux, majore, ristourne, montant };
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

// Au matin : l'impôt le 1er du mois, la commande royale le 9 (dès ★2). Renvoie les lignes du réveil.
function matinDuConseil(G) {
  const lignes = [];
  if (etoilesDe(G) < CONSEIL.etoiles) return lignes;
  const d = dateDuJour(G), cs = conseilDe(G);
  if (d.jourDuMois === 1 && cs.impotJour !== G.jour) {
    cs.impotJour = G.jour;
    const l = payerImpotDuConseil(G);
    if (l.montant > 0) lignes.push(`Le percepteur du Conseil est passé : ${pluriel(l.montant, "pièce d'impôt", "pièces d'impôt")} pour le mois${l.majore ? ' (majoré : ta commande royale ratée)' : l.ristourne ? ' (moitié prix : ta commande royale réussie)' : ''}.${l.dette ? ` Il te manquait ${pluriel(l.dette, 'pièce', 'pièces')} : une dette envers le Conseil.` : ''}`);
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
    lignes.push(manque.length ? `Commande royale du Conseil : il manque encore ${manque.length > 1 ? manque.slice(0, -1).join(', ') + ' et ' + manque[manque.length - 1] : manque[0]}. Le héraut repasse ${quand}.`
      : `Commande royale du Conseil : tout est prêt. Le héraut repasse ${quand}.`);
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
