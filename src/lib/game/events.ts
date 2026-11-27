// Cartes d'événements : un personnage, une situation, 1 à 3 choix avec coût et effet affichés.
import { addTemp, count, stats, type Game } from './sim';
import type { CommuneId } from './communes';

export type Who = 'chef' | 'commercante' | 'jeune' | 'gouverneur' | 'ong' | 'agent' | 'infirmiere' | 'enseignant' | 'diaspora';
export interface Choice { label: string; effect: string; run: (g: Game) => string | void }
export interface GEvent { id: string; who: Who; whoName: string; title: string; text: string; cond?: (g: Game) => boolean; communes?: CommuneId[]; choices: Choice[] }

export const EVENTS: GEvent[] = [
	{ id: 'edm', who: 'agent', whoName: 'Seydou, agent municipal', title: 'Délestages',
		text: 'Le courant est coupé 12 heures par jour. Au CSCom, les vaccins risquent de se gâter et les commerçants grognent.',
		choices: [
			{ label: 'Acheter un groupe électrogène', effect: '−1,5 M · confiance +4', run: (g) => { g.budget -= 1.5; g.conf += 4; } },
			{ label: 'Expliquer la situation à la radio', effect: 'Gratuit · satisfaction −5 pendant 3 mois', run: (g) => addTemp(g, 'sat', -5, 3) }
		] },
	{ id: 'fon', who: 'chef', whoName: 'Le chef de quartier', title: 'Conflit foncier',
		text: 'Deux familles revendiquent la même parcelle près du marigot. Le ton monte devant la mairie.',
		choices: [
			{ label: 'Réunir les familles avec le chef de quartier', effect: '−0,3 M · confiance +5', run: (g) => { g.budget -= 0.3; g.conf += 5; } },
			{ label: 'Laisser le tribunal trancher', effect: 'Gratuit · confiance −3', run: (g) => { g.conf -= 3; } },
			{ label: 'Attribuer la parcelle à un promoteur', effect: '+3 M · confiance −9', run: (g) => { g.budget += 3; g.conf -= 9; } }
		] },
	{ id: 'jeu', who: 'jeune', whoName: 'Adama, porte-parole des jeunes', title: 'Les jeunes du grin',
		text: 'Les jeunes demandent un tournoi de foot inter-quartiers pour les vacances.',
		choices: [
			{ label: 'Financer le tournoi', effect: '−0,8 M · confiance +5', run: (g) => { g.budget -= 0.8; g.conf += 5; addTemp(g, 'sat', 3, 2); } },
			{ label: 'Pas de budget cette année', effect: 'Confiance −4', run: (g) => { g.conf -= 4; } }
		] },
	{ id: 'ong', who: 'ong', whoName: 'Mme Diallo, ONG Eau Pour Tous', title: 'Une ONG propose un forage',
		text: 'Une ONG finance un forage complet si la commune apporte 10 % du coût.',
		choices: [
			{ label: 'Accepter', effect: '−0,3 M · un forage gratuit à placer', run: (g) => { g.budget -= 0.3; g.tok++; } },
			{ label: 'Refuser', effect: 'Rien ne change', run: () => {} }
		] },
	{ id: 'tax', who: 'commercante', whoName: 'Tanti Oumou, présidente des femmes du marché', title: 'Grève des commerçants', cond: (g) => g.tax === 2,
		text: 'Les commerçants ferment le marché pour protester contre la hausse des taxes.',
		choices: [
			{ label: 'Revenir aux impôts normaux', effect: 'Confiance +3', run: (g) => { g.tax = 1; g.conf += 3; } },
			{ label: 'Tenir bon', effect: 'Recettes du marché ÷ 2 pendant 2 mois · confiance −6', run: (g) => { addTemp(g, 'mk', -1, 2); g.conf -= 6; } }
		] },
	{ id: 'cho', who: 'infirmiere', whoName: 'Mariam, infirmière', title: 'Alerte choléra', cond: (g) => { const s = stats(g); return s.pop > 0 && s.wat < 0.5; },
		text: 'Plusieurs cas de diarrhée sont signalés dans les quartiers sans eau potable.',
		choices: [
			{ label: 'Sensibilisation et chloration des puits', effect: '−1 M · confiance +2', run: (g) => { g.budget -= 1; g.conf += 2; } },
			{ label: 'Attendre que ça passe', effect: 'Satisfaction −12 pendant 3 mois · confiance −8', run: (g) => { addTemp(g, 'sat', -12, 3); g.conf -= 8; } }
		] },
	{ id: 'gov', who: 'gouverneur', whoName: 'Le gouverneur de région', title: 'Visite du gouverneur',
		text: 'Le gouverneur annonce sa visite dans la commune.',
		choices: [
			{ label: 'Organiser une grande cérémonie', effect: '−1 M · subvention de 3 M si la satisfaction atteint 60 %',
				run: (g) => { g.budget -= 1; if (stats(g).sat >= 60) { g.budget += 3; return 'Le gouverneur est impressionné : +3 M'; } return 'Les habitants se plaignent devant le gouverneur…'; } },
			{ label: 'Une visite simple', effect: 'Rien ne change', run: () => {} }
		] },
	{ id: 'ord', who: 'chef', whoName: 'Le chef de quartier', title: 'Dépôts sauvages', cond: (g) => !count(g, 'depot'),
		text: 'Les ordures s’entassent au bord du marigot et bouchent les caniveaux.',
		choices: [
			{ label: 'Payer un GIE de collecte pour 3 mois', effect: '−1,2 M · satisfaction +4 pendant 3 mois', run: (g) => { g.budget -= 1.2; addTemp(g, 'sat', 4, 3); } },
			{ label: 'Laisser faire', effect: 'Satisfaction −6 pendant 3 mois', run: (g) => addTemp(g, 'sat', -6, 3) }
		] },
	{ id: 'dia', who: 'diaspora', whoName: 'Bakary, association des ressortissants', title: 'La diaspora se mobilise',
		text: 'Les ressortissants de la commune installés à l’étranger envoient une contribution pour le développement.',
		choices: [{ label: 'Recevoir la délégation avec les honneurs', effect: '+3 M · confiance +2', run: (g) => { g.budget += 3; g.conf += 2; } }] },
	{ id: 'ens', who: 'enseignant', whoName: 'M. Konaté, enseignant', title: 'Enseignants en colère', cond: (g) => count(g, 'ecole') > 0 && g.budget < 2,
		text: 'Les enseignants communaux réclament trois mois d’arriérés de salaire.',
		choices: [
			{ label: 'Payer les arriérés', effect: '−2 M · confiance +3', run: (g) => { g.budget -= 2; g.conf += 3; } },
			{ label: 'Promettre pour plus tard', effect: 'Satisfaction −8 pendant 2 mois', run: (g) => addTemp(g, 'sat', -8, 2) }
		] },
	{ id: 'mar', who: 'commercante', whoName: 'Tanti Oumou, présidente des femmes du marché', title: 'Le marché déborde', cond: (g) => count(g, 'marche') > 0,
		text: 'Les vendeuses s’installent sur la route et bloquent la circulation des sotramas.',
		choices: [
			{ label: 'Négocier un nouvel emplacement', effect: '−0,5 M · confiance +3', run: (g) => { g.budget -= 0.5; g.conf += 3; } },
			{ label: 'Faire déguerpir par la police', effect: 'Gratuit · confiance −6', run: (g) => { g.conf -= 6; } }
		] }
];


// ---------- Événements propres à chaque commune ----------
const mois = (g: Game) => g.m % 12; // 0 = janvier
export const LOCAL: GEvent[] = [
	// Koutiala
	{ id: 'kt-coton', communes: ['koutiala'], who: 'agent', whoName: 'Seydou, agent municipal', title: 'Campagne cotonnière', cond: (g) => mois(g) >= 10 || mois(g) <= 1,
		text: 'Les camions de coton-graine font la queue devant l’usine et stationnent partout en ville. Les commerçants se plaignent.',
		choices: [
			{ label: 'Taxer le stationnement des camions', effect: '+1,5 M · satisfaction −4 pendant 2 mois', run: (g) => { g.budget += 1.5; addTemp(g, 'sat', -4, 2); } },
			{ label: 'Aménager une aire d’attente avec la société cotonnière', effect: '−1 M · confiance +4', run: (g) => { g.budget -= 1; g.conf += 4; } }
		] },
	{ id: 'kt-exode', communes: ['koutiala'], who: 'chef', whoName: 'Le chef de quartier', title: 'Des familles arrivent des villages',
		text: 'Après une mauvaise récolte, des familles viennent chercher du travail en ville. Elles s’installent où elles peuvent.',
		choices: [
			{ label: 'Ouvrir un lotissement social', effect: '−1 M · confiance +4', run: (g) => { g.budget -= 1; g.conf += 4; } },
			{ label: 'Laisser faire', effect: 'Satisfaction −4 pendant 3 mois · confiance −3', run: (g) => { addTemp(g, 'sat', -4, 3); g.conf -= 3; } }
		] },
	// Ségou
	{ id: 'sg-festival', communes: ['segou'], who: 'jeune', whoName: 'Adama, porte-parole des jeunes', title: 'Le Festival sur le Niger', cond: (g) => mois(g) === 0 || mois(g) === 1,
		text: 'Les organisateurs du festival demandent l’appui de la mairie pour accueillir les visiteurs sur les berges.',
		choices: [
			{ label: 'Nettoyer les berges et accueillir les visiteurs', effect: '−1 M puis +2,5 M de retombées · confiance +3', run: (g) => { g.budget += 1.5; g.conf += 3; return 'Les hôtels et les maquis affichent complet : +2,5 M de retombées.'; } },
			{ label: 'Laisser les organisateurs se débrouiller', effect: 'Confiance −2', run: (g) => { g.conf -= 2; } }
		] },
	{ id: 'sg-crue', communes: ['segou', 'koulikoro'], who: 'agent', whoName: 'Seydou, agent municipal', title: 'Le Niger monte', cond: (g) => mois(g) >= 6 && mois(g) <= 8,
		text: 'Le fleuve est en crue. Dans les quartiers bas, l’eau approche des concessions.',
		choices: [
			{ label: 'Sacs de sable et alerte dans les quartiers bas', effect: '−0,8 M · risque d’inondation réduit', run: (g) => { g.budget -= 0.8; g.cure = 1; } },
			{ label: 'Attendre la décrue', effect: 'Gratuit', run: () => {} }
		] },
	{ id: 'sg-potieres', communes: ['segou'], who: 'commercante', whoName: 'Tanti Oumou, présidente des potières', title: 'Les potières veulent un espace',
		text: 'Les potières demandent un espace de vente couvert au bord du fleuve, près du quai.',
		choices: [
			{ label: 'Construire un hangar de vente', effect: '−0,6 M · confiance +4 · satisfaction +3 pendant 3 mois', run: (g) => { g.budget -= 0.6; g.conf += 4; addTemp(g, 'sat', 3, 3); } },
			{ label: 'Pas cette année', effect: 'Confiance −3', run: (g) => { g.conf -= 3; } }
		] },
	// Bougouni
	{ id: 'bg-camions', communes: ['bougouni'], who: 'agent', whoName: 'Seydou, agent municipal', title: 'Les routes s’abîment',
		text: 'Les camions des mines de lithium défoncent les rues de la ville. Les habitants respirent la poussière.',
		choices: [
			{ label: 'Taxe de passage sur les poids lourds', effect: '+2 M · satisfaction −3 pendant 2 mois', run: (g) => { g.budget += 2; addTemp(g, 'sat', -3, 2); } },
			{ label: 'Réparer et arroser les rues', effect: '−1,5 M · confiance +3', run: (g) => { g.budget -= 1.5; g.conf += 3; } }
		] },
	{ id: 'bg-fonds', communes: ['bougouni'], who: 'ong', whoName: 'Mme Diallo, société civile', title: 'Le fonds de développement local',
		text: 'La société minière verse 3 M à la commune pour le développement local. La société civile demande comment ils seront utilisés.',
		choices: [
			{ label: 'Publier l’utilisation des fonds en assemblée publique', effect: '+3 M · confiance +6', run: (g) => { g.budget += 3; g.conf += 6; } },
			{ label: 'Gérer en toute discrétion', effect: '+3 M · confiance −7 (les rumeurs courent)', run: (g) => { g.budget += 3; g.conf -= 7; } }
		] },
	{ id: 'bg-mangues', communes: ['bougouni'], who: 'commercante', whoName: 'Tanti Oumou, présidente des femmes du marché', title: 'La saison des mangues', cond: (g) => mois(g) >= 2 && mois(g) <= 5,
		text: 'Les mangues arrivent par tonnes. Les camions d’exportateurs encombrent le marché et une partie de la récolte pourrit.',
		choices: [
			{ label: 'Aménager une aire de groupage', effect: '−0,8 M · confiance +3 · recettes du marché', run: (g) => { g.budget -= 0.8; g.conf += 3; addTemp(g, 'sat', 2, 2); } },
			{ label: 'Laisser faire', effect: 'Satisfaction −3 pendant 2 mois', run: (g) => addTemp(g, 'sat', -3, 2) }
		] },
	// Koulikoro
	{ id: 'kk-sable', communes: ['koulikoro'], who: 'enseignant', whoName: 'M. Konaté, enseignant', title: 'Le sable du fleuve',
		text: 'L’extraction de sable rapporte vite. Des élèves quittent l’école pour charger les camions sur les berges.',
		choices: [
			{ label: 'Réglementer l’extraction et sensibiliser', effect: '−0,6 M · confiance +3', run: (g) => { g.budget -= 0.6; g.conf += 3; } },
			{ label: 'Taxer les camions de sable', effect: '+1,5 M · satisfaction −4 pendant 2 mois', run: (g) => { g.budget += 1.5; addTemp(g, 'sat', -4, 2); } }
		] },
	{ id: 'kk-bateaux', communes: ['koulikoro'], who: 'commercante', whoName: 'Tanti Oumou, présidente des femmes du marché', title: 'Les bateaux repartent', cond: (g) => mois(g) >= 7 && mois(g) <= 10,
		text: 'L’eau est assez haute : les bateaux chargent pour Ségou et Mopti. Le port s’anime.',
		choices: [
			{ label: 'Aménager le quai pour la saison', effect: '−1 M puis +2,5 M de taxes portuaires', run: (g) => { g.budget += 1.5; return 'Saison réussie au port : +2,5 M de taxes.'; } },
			{ label: 'Laisser faire', effect: '+0,8 M', run: (g) => { g.budget += 0.8; } }
		] },
	// Sirakorola
	{ id: 'sk-troupeaux', communes: ['sirakorola'], who: 'chef', whoName: 'Le chef de village', title: 'Un champ ravagé', cond: (g) => mois(g) >= 8 && mois(g) <= 11,
		text: 'Un troupeau de passage a détruit un champ de mil avant la récolte. Cultivateurs et éleveurs sont venus à la mairie, très en colère.',
		choices: [
			{ label: 'Réunir une commission de conciliation', effect: '−0,3 M · confiance +5', run: (g) => { g.budget -= 0.3; g.conf += 5; } },
			{ label: 'Infliger une amende aux éleveurs', effect: '+0,5 M · confiance −4', run: (g) => { g.budget += 0.5; g.conf -= 4; } }
		] },
	{ id: 'sk-soudure', communes: ['sirakorola'], who: 'infirmiere', whoName: 'Mariam, infirmière', title: 'La soudure', cond: (g) => mois(g) >= 5 && mois(g) <= 7,
		text: 'Les greniers se vident avant la nouvelle récolte. Au CSCom, on voit plus d’enfants mal nourris.',
		choices: [
			{ label: 'Vendre le mil de la banque de céréales à prix modéré', effect: '−1 M · satisfaction +5 pendant 3 mois', run: (g) => { g.budget -= 1; addTemp(g, 'sat', 5, 3); } },
			{ label: 'Attendre la récolte', effect: 'Satisfaction −8 pendant 3 mois · confiance −4', run: (g) => { addTemp(g, 'sat', -8, 3); g.conf -= 4; } }
		] },
	{ id: 'sk-piste', communes: ['sirakorola'], who: 'agent', whoName: 'Seydou, agent municipal', title: 'La piste est coupée', cond: (g) => mois(g) >= 6 && mois(g) <= 8,
		text: 'Les pluies ont emporté un tronçon de piste. Les villages ne peuvent plus aller au marché ni au CSCom.',
		choices: [
			{ label: 'Remblayer avec les jeunes du village', effect: '−1,2 M · confiance +4', run: (g) => { g.budget -= 1.2; g.conf += 4; } },
			{ label: 'Attendre la saison sèche', effect: 'Satisfaction −5 pendant 2 mois', run: (g) => addTemp(g, 'sat', -5, 2) }
		] }
];

export const EV_HIV: GEvent = {
	id: 'hiv', who: 'agent', whoName: 'Seydou, agent municipal', title: 'L’hivernage approche',
	text: 'Les premières pluies arrivent en juin. Les caniveaux sont bouchés par le sable et les sachets plastiques.',
	choices: [
		{ label: 'Curer les caniveaux et sensibiliser', effect: '−0,5 M · risque d’inondation fortement réduit', run: (g) => { g.budget -= 0.5; g.cure = 1; } },
		{ label: 'Faire confiance à la chance', effect: 'Gratuit', run: () => {} }
	]
};

export function pickEvent(g: Game): GEvent | null {
	if (g.m % 12 === 4) return EV_HIV;
	if (Math.random() >= 0.45) return null;
	const ok = (e: GEvent) => e.id !== g.lastEv && (!e.cond || e.cond(g)) && (!e.communes || e.communes.includes(g.commune));
	// les événements de la commune comptent double : c'est ce qui la rend reconnaissable
	const pool = [...EVENTS.filter(ok), ...LOCAL.filter(ok), ...LOCAL.filter(ok)];
	return pool.length ? pool[(Math.random() * pool.length) | 0] : null;
}
