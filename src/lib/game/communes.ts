// Les communes jouables. Communes réelles (celles de la plateforme « Ma Commune » d'ID-SAHEL),
// situations de jeu fictives : aucun élu réel, aucun chiffre officiel. Les cartes sont des
// évocations (fleuve, marigot, axes routiers, repères), pas des plans.

export type CommuneId = 'koutiala' | 'segou' | 'bougouni' | 'koulikoro' | 'sirakorola' | 'benkadi';

export interface CommuneDef {
	id: CommuneId;
	nom: string;
	region: string;
	profil: 'urbaine' | 'rurale' | 'fictive';
	devise: string; // une phrase qui donne l'ambiance
	desc: string; // ce qui change en jeu
	difficulte: 'Facile' | 'Moyenne' | 'Difficile';
	budget: number; // M FCFA au départ
	conf: number; // confiance au départ
	taxe: number; // multiplicateur des impôts locaux (rural < urbain)
	dotation: number; // multiplicateur de la dotation annuelle de l'État
	pluie: number; // multiplicateur du risque d'inondation
	vert: number; // verdissement de base du sol (sud plus humide)
	arbre: number; // essence dominante : 0-1 néré, 2 manguier, 3 baobab, 4 balanzan
	repere: string; // bâtiment emblématique
	repliques: string[]; // ce que disent les habitants quand tout va bien
}

export const COMMUNES: Record<CommuneId, CommuneDef> = {
	koutiala: {
		id: 'koutiala', nom: 'Koutiala', region: 'Région de Koutiala', profil: 'urbaine',
		devise: 'La capitale de l’or blanc, au carrefour des routes du Burkina et de la Côte d’Ivoire.',
		desc: 'Grande ville cotonnière : une usine d’égrenage rapporte, mais un marigot traverse la ville et déborde en hivernage. Les familles des villages arrivent sans cesse.',
		difficulte: 'Moyenne', budget: 18, conf: 55, taxe: 1, dotation: 1, pluie: 1.1, vert: 0.05, arbre: 0,
		repere: 'Usine d’égrenage de coton',
		repliques: ['Ici, c’est la capitale de l’or blanc !', 'Pendant la campagne, l’usine tourne jour et nuit.', 'Mon frère est venu du village chercher du travail en ville.']
	},
	segou: {
		id: 'segou', nom: 'Ségou', region: 'Région de Ségou', profil: 'urbaine',
		devise: 'La cité des balanzans, sur la rive droite du Niger.',
		desc: 'Le fleuve borde la ville : quai des pirogues, pêche, poterie et festival. Mais quand le Niger monte, les quartiers bas ont les pieds dans l’eau.',
		difficulte: 'Facile', budget: 16, conf: 58, taxe: 1, dotation: 1, pluie: 1, vert: 0, arbre: 4,
		repere: 'Quai des pirogues',
		repliques: ['Ségou, la cité des balanzans.', 'Le poisson du matin est déjà vendu.', 'Pendant le festival, toute la ville est sur les berges.']
	},
	bougouni: {
		id: 'bougouni', nom: 'Bougouni', region: 'Région de Bougouni', profil: 'urbaine',
		devise: 'Jeune capitale régionale du sud, entre manguiers, coton et mines de lithium.',
		desc: 'Terre plus verte et plus arrosée. Les camions des mines passent par la ville : des recettes, des routes abîmées et une question de transparence.',
		difficulte: 'Moyenne', budget: 15, conf: 55, taxe: 1, dotation: 1.1, pluie: 1.3, vert: 0.22, arbre: 2,
		repere: 'Aire des camions',
		repliques: ['Les mangues de Bougouni sont les meilleures !', 'Les camions de la mine passent jour et nuit.', 'Depuis qu’on est région, les services arrivent.']
	},
	koulikoro: {
		id: 'koulikoro', nom: 'Koulikoro', region: 'Région de Koulikoro', profil: 'urbaine',
		devise: 'Ville-port sur le Niger, au bout de la ligne Dakar-Niger.',
		desc: 'Le port et la gare font vivre la ville. Sur les berges, l’extraction de sable rapporte vite mais attire les élèves hors de l’école.',
		difficulte: 'Moyenne', budget: 14, conf: 55, taxe: 1, dotation: 1, pluie: 1, vert: 0.04, arbre: 1,
		repere: 'Gare et port fluvial',
		repliques: ['Quand l’eau monte, les bateaux partent vers Ségou et Mopti.', 'Le sable du fleuve, c’est notre pain.', 'Le chemin de fer s’arrête ici, chez nous.']
	},
	sirakorola: {
		id: 'sirakorola', nom: 'Sirakorola', region: 'Cercle de Koulikoro', profil: 'rurale',
		devise: 'Commune rurale sur la route de Banamba : villages, champs de mil et troupeaux.',
		desc: 'Plusieurs villages éloignés, peu d’impôts, des pistes qui coupent en hivernage. Chaque forage compte, et la soudure met les greniers à l’épreuve.',
		difficulte: 'Difficile', budget: 8, conf: 60, taxe: 0.55, dotation: 1.6, pluie: 0.8, vert: 0.08, arbre: 0,
		repere: 'Banque de céréales',
		repliques: ['Le forage du village a changé notre vie.', 'Cette année, le mil a bien donné.', 'La piste vers Koulikoro est enfin praticable.']
	},
	benkadi: {
		id: 'benkadi', nom: 'Bènkadi', region: 'Au bord du fleuve', profil: 'fictive',
		devise: 'Une commune inventée au bord du fleuve, pour apprendre en douceur.',
		desc: 'La carte du premier prototype : un bon terrain d’entraînement.',
		difficulte: 'Facile', budget: 15, conf: 55, taxe: 1, dotation: 1, pluie: 1, vert: 0, arbre: 0,
		repere: 'Mairie',
		repliques: ['I ni ce, Mèri ! Le quartier se porte bien.']
	}
};

export const COMMUNE_ORDER: CommuneId[] = ['segou', 'koutiala', 'koulikoro', 'bougouni', 'sirakorola', 'benkadi'];
