// Constantes de jeu : bâtiments, outils, catégories, équilibrage.
// Les coûts sont en millions de FCFA (chiffres de jeu, pas des données réelles).

export const TW = 64;
export const TH = 32;
export const N = 16;

export type Svc = 'eau' | 'edu' | 'san' | 'dech' | 'lum' | 'loi' | 'com' | 'omb' | 'drain';
export type BKey =
	| 'route' | 'lot' | 'caniveau'
	| 'forage' | 'borne' | 'marche' | 'ecole' | 'cscom'
	| 'depot' | 'lampe' | 'arbre' | 'foot'
	| 'mairie' | 'house';
export type Tool = BKey | 'voir' | 'demolir';

export interface BDef {
	label: string;
	cost: number;
	maint: number;
	r?: number;
	svc?: Svc;
	desc: string;
	brush?: boolean; // se trace au doigt, comme un pinceau
}

export const B: Record<BKey, BDef> = {
	route: { label: 'Route', cost: 0.2, maint: 0.005, brush: true, desc: 'Route en latérite. Les familles ne s’installent que le long d’une route.' },
	lot: { label: 'Lotissement', cost: 0.5, maint: 0, brush: true, desc: 'Parcelle à habiter. Une famille s’y installe si une route passe à côté.' },
	caniveau: { label: 'Caniveau', cost: 0.4, maint: 0.005, r: 1, svc: 'drain', brush: true, desc: 'Protège les bas-fonds voisins des inondations d’hivernage.' },
	forage: { label: 'Forage', cost: 3, maint: 0.05, r: 3, svc: 'eau', desc: 'Château d’eau : eau potable pour les concessions proches (rayon 3).' },
	borne: { label: 'Borne', cost: 1, maint: 0.02, r: 2, svc: 'eau', desc: 'Borne-fontaine : robinet public, moins cher qu’un forage (rayon 2).' },
	marche: { label: 'Marché', cost: 6, maint: 0.1, r: 4, svc: 'com', desc: 'Rapporte des taxes chaque mois et anime le quartier (rayon 4).' },
	ecole: { label: 'École', cost: 8, maint: 0.3, r: 4, svc: 'edu', desc: 'Indispensable pour que les maisons deviennent des R+1 (rayon 4).' },
	cscom: { label: 'CSCom', cost: 10, maint: 0.4, r: 5, svc: 'san', desc: 'Centre de santé communautaire (rayon 5).' },
	depot: { label: 'Dépôt d’ordures', cost: 4, maint: 0.2, r: 4, svc: 'dech', desc: 'Dépôt de transit : collecte les ordures (rayon 4), mais gêne les voisins immédiats.' },
	lampe: { label: 'Lampadaire', cost: 0.8, maint: 0.01, r: 2, svc: 'lum', desc: 'Lampadaire solaire : éclaire les rues la nuit, plus de sécurité (rayon 2).' },
	arbre: { label: 'Arbre', cost: 0.1, maint: 0, r: 1, svc: 'omb', brush: true, desc: 'Néré, manguier ou baobab : ombre et fraîcheur.' },
	foot: { label: 'Terrain', cost: 2, maint: 0.03, r: 3, svc: 'loi', desc: 'Terrain de foot : les jeunes du grin en redemandent (rayon 3).' },
	mairie: { label: 'Mairie', cost: 0, maint: 0.2, r: 1, svc: 'lum', desc: 'Le cœur de la commune. C’est ici que tu siègeras.' },
	house: { label: 'Concession', cost: 0, maint: 0, desc: '' }
};

export const DEMOLIR = { label: 'Démolir', cost: 0.1, desc: 'Détruit ce qui se trouve sur la case. Glisse le doigt pour en démolir plusieurs.' };
export const VOIR = { label: 'Voir', desc: 'Touche un bâtiment, une concession ou un habitant.' };

export const CONFIRM_FROM = 2; // au-delà de ce coût, on demande confirmation

export interface Cat { id: string; label: string; tools: BKey[]; icon: BKey }
export const CATS: Cat[] = [
	{ id: 'routes', label: 'Routes', icon: 'route', tools: ['route', 'lot', 'caniveau'] },
	{ id: 'services', label: 'Services', icon: 'ecole', tools: ['borne', 'forage', 'marche', 'ecole', 'cscom'] },
	{ id: 'quartier', label: 'Quartier', icon: 'arbre', tools: ['arbre', 'lampe', 'foot', 'depot'] }
];

export const POP = [0, 12, 30, 70];
export const LVL = ['Parcelle vide', 'Case en banco', 'Maison en dur', 'Immeuble R+1'];
export const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
export const SVC_LIST: [Svc, string][] = [
	['eau', 'Eau'], ['edu', 'École'], ['san', 'Santé'], ['dech', 'Ordures'],
	['lum', 'Lumière'], ['loi', 'Loisirs'], ['com', 'Marché']
];
export const LAYERS: [string, Svc | null][] = [
	['aucun', null], ['eau', 'eau'], ['écoles', 'edu'], ['santé', 'san'], ['inondations', 'drain']
];
export const TAX = ['bas', 'normaux', 'élevés'];
export const TAX_MULT = [0.7, 1, 1.4];
export const TAX_CONF = [0.6, 0, -1.2];

export const START_YEAR = 2027;
export const MANDATE = 60; // mois

export const money = (m: number) => {
	const a = Math.abs(m);
	const s = a < 10 ? a.toFixed(1) : String(Math.round(a));
	return (m < 0 ? '−' : '') + s.replace('.', ',') + ' M';
};
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const hash = (x: number, y: number) =>
	(((x * 73856093) ^ (y * 19349663) ^ (x * y * 83492791)) >>> 0) % 1000 / 1000;
