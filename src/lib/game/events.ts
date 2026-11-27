// Cartes d'événements : un personnage, une situation, 1 à 3 choix avec coût et effet affichés.
import { addTemp, count, stats, type Game } from './sim';

export type Who = 'chef' | 'commercante' | 'jeune' | 'gouverneur' | 'ong' | 'agent' | 'infirmiere' | 'enseignant' | 'diaspora';
export interface Choice { label: string; effect: string; run: (g: Game) => string | void }
export interface GEvent { id: string; who: Who; whoName: string; title: string; text: string; cond?: (g: Game) => boolean; choices: Choice[] }

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
	const pool = EVENTS.filter((e) => e.id !== g.lastEv && (!e.cond || e.cond(g)));
	return pool.length ? pool[(Math.random() * pool.length) | 0] : null;
}
