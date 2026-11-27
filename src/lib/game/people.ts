// Habitants : apparition selon la population et les bâtiments, déplacements sur les routes, répliques.
import { N, type BKey } from './config';
import { coverage, count, at, stats, isRain, type Game } from './sim';
import { SKIN, WAX, type PKind, type Look, type PDraw } from './render';

export interface Person extends PDraw {
	id: number; name: string; role: string;
	x: number; y: number;
	cur: number; // case de route courante
	prev: number;
	ax: number; ay: number; bx: number; by: number; prog: number; len: number;
	state: 'walk' | 'in' | 'stay' | 'out' | 'fixed' | 'play';
	goal: BKey | null; goalI: number; t: number; speed: number; lane: number; home: number;
}
export interface Ball { x: number; y: number; h: number; i: number }

const F_NAMES = ['Awa', 'Mariam', 'Oumou', 'Fatoumata', 'Kadiatou', 'Aminata', 'Rokia', 'Assitan', 'Bintou', 'Hawa', 'Djénéba', 'Salimata'];
const M_NAMES = ['Moussa', 'Seydou', 'Bakary', 'Modibo', 'Adama', 'Souleymane', 'Issa', 'Drissa', 'Mamadou', 'Oumar', 'Boubacar', 'Yacouba'];
const SURN = ['Traoré', 'Coulibaly', 'Diarra', 'Keïta', 'Konaté', 'Sangaré', 'Touré', 'Dembélé', 'Sidibé', 'Maïga', 'Diallo', 'Sissoko', 'Kanté', 'Doumbia'];
export const ROLES: Record<PKind, string> = {
	vendeuse: 'Vendeuse au marché', porteuse: 'Mère de famille', moto: 'Conducteur de moto Djakarta', eleve: 'Élève',
	doyen: 'Doyen du quartier', jeune: 'Jeune du grin', agent: 'Agent de la mairie', sotrama: 'Apprenti de sotrama'
};
const SPEED: Record<PKind, number> = { vendeuse: 0.42, porteuse: 0.45, moto: 1.25, eleve: 0.5, doyen: 0.26, jeune: 0.55, agent: 0.48, sotrama: 0.85 };
const FEMALE: PKind[] = ['vendeuse', 'porteuse'];

const pick = <T>(a: T[]) => a[(Math.random() * a.length) | 0];
let uid = 1;

export function makeLook(kind: PKind): Look {
	const skin = pick(SKIN);
	switch (kind) {
		case 'vendeuse': case 'porteuse': return { skin, a: pick(WAX), b: pick(WAX), c: pick(WAX) };
		case 'doyen': return { skin, a: pick(['#9cc3e6', '#f4efe2', '#c9d8b6', '#d8c6e8']), b: '#e8d9b0', c: pick(['#f4efe2', '#8a3b8f', '#2b2a33']) };
		case 'eleve': return { skin, a: '#c8b27a', b: pick(['#c2452d', '#3d6db3', '#f2b632']), c: 'none' };
		case 'jeune': { const k = pick(['#f2b632', '#c2452d', '#2f8a57', '#3d6db3', '#f3f0e8']); return { skin, a: k, b: k === '#f3f0e8' ? '#c2452d' : '#f3f0e8', c: Math.random() < 0.5 ? pick(['#2b2a33', '#c2452d']) : 'none' }; }
		case 'agent': return { skin, a: pick(['#d9c59a', '#cfe0ef', '#f3f0e8']), b: '#2b2a33', c: 'none' };
		case 'moto': return { skin, a: pick(['#3d6db3', '#f3f0e8', '#c2452d', '#2f7d8c']), b: pick(['#c2452d', '#1f5fa8', '#2b2a33']), c: pick(['#2b2a33', '#f2b632', '#f3f0e8']) };
		default: return { skin, a: '#2e8b3e', b: '#2e8b3e', c: '#2e8b3e' };
	}
}

export class People {
	list: Person[] = [];
	balls: Ball[] = [];
	private ver = -1;
	private roads: number[] = [];
	private syncT = 0;

	reset() { this.list = []; this.balls = []; this.ver = -1; }

	private isRoad(g: Game, i: number) { return g.map[i]?.b === 'route'; }
	private nbRoads(g: Game, i: number) {
		const x = i % N, y = (i / N) | 0, r: number[] = [];
		for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const t = at(g.map, x + a, y + b); if (t?.b === 'route') r.push((y + b) * N + x + a); }
		return r;
	}
	private find(g: Game, b: BKey) { const r: number[] = []; g.map.forEach((t, i) => { if (t.b === b) r.push(i); }); return r; }
	private adjRoad(g: Game, i: number) { return this.nbRoads(g, i); }

	private spawn(g: Game, kind: PKind): Person | null {
		if (!this.roads.length) return null;
		const cur = pick(this.roads), x = (cur % N) + 0.5, y = ((cur / N) | 0) + 0.5;
		const fem = FEMALE.includes(kind) || ((kind === 'eleve' || kind === 'jeune') && Math.random() < 0.45);
		const name = `${pick(fem ? F_NAMES : M_NAMES)} ${pick(SURN)}`;
		const p: Person = {
			id: uid++, kind, name, role: ROLES[kind], look: makeLook(kind), phase: Math.random() * 6, moving: true, dir: 1, axis: 'x', carry: kind !== 'porteuse',
			x, y, cur, prev: -1, ax: x, ay: y, bx: x, by: y, prog: 1, len: 1, state: 'walk', goal: null, goalI: -1, t: 0,
			speed: SPEED[kind] * (0.85 + Math.random() * 0.3), lane: kind === 'sotrama' ? 0 : kind === 'moto' ? (Math.random() < 0.5 ? -0.08 : 0.08) : Math.random() < 0.5 ? -0.2 : 0.2, home: -1
		};
		this.setGoal(g, p);
		return p;
	}

	private setGoal(g: Game, p: Person) {
		const want: Record<PKind, BKey[]> = {
			vendeuse: p.carry ? ['marche'] : ['house'], porteuse: p.carry ? ['house'] : ['forage', 'borne'], eleve: ['ecole', 'house'],
			doyen: ['marche', 'mairie', 'house'], agent: ['mairie', 'marche'], jeune: ['foot', 'marche'], moto: [], sotrama: []
		};
		let opts = want[p.kind];
		if (p.kind !== 'porteuse' && p.kind !== 'vendeuse') opts = [...opts].sort(() => Math.random() - 0.5);
		for (const b of opts) {
			const list = this.find(g, b).filter((i) => this.adjRoad(g, i).length);
			if (list.length) { p.goal = b; p.goalI = pick(list); return; }
		}
		p.goal = null; p.goalI = -1;
	}

	private stayTime(p: Person) {
		switch (p.goal) { case 'marche': return p.kind === 'vendeuse' ? 14 : 5; case 'ecole': return 12; case 'mairie': return 8; case 'forage': case 'borne': return 3; case 'house': return 6; default: return 4; }
	}

	private seg(p: Person, bx: number, by: number) {
		p.ax = p.x; p.ay = p.y; p.bx = bx; p.by = by; p.prog = 0;
		p.len = Math.max(0.05, Math.hypot(bx - p.ax, by - p.ay));
		const dx = bx - p.ax, dy = by - p.ay;
		if (Math.abs(dx) >= Math.abs(dy)) { p.axis = 'x'; p.dir = Math.sign(dx) || 1; } else { p.axis = 'y'; p.dir = Math.sign(dy) || 1; }
	}

	private nextRoad(g: Game, p: Person) {
		const nb = this.nbRoads(g, p.cur);
		if (!nb.length) return;
		let opts = nb.filter((i) => i !== p.prev);
		if (!opts.length) opts = nb;
		let nxt = pick(opts);
		if (p.goalI >= 0 && Math.random() < 0.75) {
			const gx = p.goalI % N, gy = (p.goalI / N) | 0;
			opts.sort((a, b) => (Math.abs((a % N) - gx) + Math.abs(((a / N) | 0) - gy)) - (Math.abs((b % N) - gx) + Math.abs(((b / N) | 0) - gy)));
			nxt = opts[0];
		}
		const cx = (p.cur % N) + 0.5, cy = ((p.cur / N) | 0) + 0.5, nx = (nxt % N) + 0.5, ny = ((nxt / N) | 0) + 0.5;
		const dx = nx - cx, dy = ny - cy;
		p.prev = p.cur; p.cur = nxt;
		this.seg(p, nx + -dy * p.lane, ny + dx * p.lane);
	}

	private fixtures(g: Game) {
		this.list = this.list.filter((p) => p.state !== 'fixed' && p.state !== 'play');
		this.balls = [];
		const stalls: [number, number][] = [[-0.2, -0.04], [0.2, 0.36]];
		this.find(g, 'marche').forEach((i) => stalls.forEach(([dx, dy]) => {
			const p = this.spawnFixed(g, 'vendeuse', i, (i % N) + 0.5 + dx, ((i / N) | 0) + 0.5 + dy); p.carry = false;
		}));
		this.find(g, 'foot').slice(0, 3).forEach((i) => {
			const cx = (i % N) + 0.5, cy = ((i / N) | 0) + 0.5;
			this.balls.push({ x: cx, y: cy, h: 0, i });
			for (let k = 0; k < 4; k++) { const p = this.spawnFixed(g, 'jeune', i, cx + (k % 2 ? 0.2 : -0.2), cy + (k < 2 ? -0.2 : 0.2)); p.state = 'play'; p.t = k * 1.6; }
		});
	}
	private spawnFixed(g: Game, kind: PKind, home: number, x: number, y: number) {
		const fem = FEMALE.includes(kind) || Math.random() < 0.3;
		const p: Person = {
			id: uid++, kind, name: `${pick(fem ? F_NAMES : M_NAMES)} ${pick(SURN)}`, role: ROLES[kind], look: makeLook(kind), phase: 0, moving: false, dir: 1, axis: 'x',
			x, y, cur: home, prev: -1, ax: x, ay: y, bx: x, by: y, prog: 1, len: 1, state: 'fixed', goal: null, goalI: -1, t: 0, speed: SPEED[kind], lane: 0, home
		};
		this.list.push(p);
		return p;
	}

	/** Ajuste la foule à la commune : appelé à chaque image, ne recalcule qu'au changement de carte ou toutes les 2 s. */
	sync(g: Game, dt: number) {
		this.syncT -= dt;
		if (this.ver === g.ver && this.syncT > 0) return;
		this.syncT = 2;
		const mapChanged = this.ver !== g.ver;
		this.ver = g.ver;
		this.roads = [];
		g.map.forEach((t, i) => { if (t.b === 'route') this.roads.push(i); });
		if (mapChanged) this.fixtures(g);
		// retirer ceux dont la route a disparu
		this.list = this.list.filter((p) => p.state === 'fixed' || p.state === 'play' || this.isRoad(g, p.cur));
		const pop = stats(g).pop;
		const want: Partial<Record<PKind, number>> = {
			doyen: Math.min(4, 1 + Math.floor(pop / 150)),
			agent: Math.min(2, 1 + Math.floor(pop / 300)),
			porteuse: count(g, 'forage') + count(g, 'borne') ? Math.min(10, 1 + Math.floor(pop / 45)) : 0,
			vendeuse: count(g, 'marche') ? Math.min(8, 1 + Math.floor(pop / 60)) : 0,
			eleve: count(g, 'ecole') ? Math.min(12, 2 + Math.floor(pop / 35)) : 0,
			jeune: Math.min(6, Math.floor(pop / 70)),
			moto: pop >= 60 ? Math.min(8, Math.floor(pop / 60)) : 0,
			sotrama: pop >= 400 ? 2 : pop >= 150 ? 1 : 0
		};
		for (const k of Object.keys(want) as PKind[]) {
			const have = this.list.filter((p) => p.kind === k && p.state !== 'fixed' && p.state !== 'play');
			const n = want[k] ?? 0;
			for (let j = have.length; j < n; j++) { const p = this.spawn(g, k); if (p) this.list.push(p); }
			if (have.length > n) { const drop = new Set(have.slice(n).map((p) => p.id)); this.list = this.list.filter((p) => !drop.has(p.id)); }
		}
		// buts disparus
		this.list.forEach((p) => { if (p.goalI >= 0 && g.map[p.goalI]?.b !== p.goal) this.setGoal(g, p); });
	}

	update(g: Game, dt: number, time: number) {
		this.sync(g, dt);
		for (const b of this.balls) {
			const s = time / 1000;
			b.x = (b.i % N) + 0.5 + Math.cos(s * 1.1) * 0.28; b.y = ((b.i / N) | 0) + 0.5 + Math.sin(s * 1.7) * 0.2;
			b.h = Math.abs(Math.sin(s * 3.2)) * 7;
		}
		for (const p of this.list) {
			if (p.state === 'fixed') { p.moving = false; continue; }
			if (p.state === 'play') {
				const b = this.balls.find((q) => q.i === p.home);
				if (b) {
					p.t += dt;
					const tx = b.x + Math.cos(p.t * 0.7 + p.id) * 0.22, ty = b.y + Math.sin(p.t * 0.9 + p.id) * 0.18;
					const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
					p.moving = d > 0.02;
					if (p.moving) { const st = Math.min(d, dt * 0.6); p.x += dx / d * st; p.y += dy / d * st; p.phase += dt * 12; p.dir = Math.sign(dx) || 1; }
				}
				continue;
			}
			if (p.state === 'stay') {
				p.moving = false; p.t -= dt;
				if (p.t <= 0) {
					if (p.kind === 'porteuse') p.carry = !p.carry;
					if (p.kind === 'vendeuse') p.carry = !p.carry;
					p.state = 'out';
					this.seg(p, (p.cur % N) + 0.5, ((p.cur / N) | 0) + 0.5);
				}
				continue;
			}
			p.moving = true;
			p.prog += (p.speed * dt) / p.len;
			p.phase += dt * 11 * Math.min(1.4, p.speed * 2);
			if (p.prog >= 1) {
				p.x = p.bx; p.y = p.by;
				if (p.state === 'in') { p.state = 'stay'; p.t = this.stayTime(p); continue; }
				if (p.state === 'out') { p.state = 'walk'; this.setGoal(g, p); }
				if (p.goalI >= 0 && this.adjRoad(g, p.goalI).includes(p.cur) && p.kind !== 'moto' && p.kind !== 'sotrama') {
					const gx = (p.goalI % N) + 0.5, gy = ((p.goalI / N) | 0) + 0.5, cx = (p.cur % N) + 0.5, cy = ((p.cur / N) | 0) + 0.5;
					p.state = 'in';
					this.seg(p, cx + (gx - cx) * 0.62, cy + (gy - cy) * 0.62);
				} else this.nextRoad(g, p);
			} else {
				p.x = p.ax + (p.bx - p.ax) * p.prog; p.y = p.ay + (p.by - p.ay) * p.prog;
			}
		}
	}
}

// ---------- Répliques ----------
export function quote(g: Game, p: Person): string {
	const c = coverage(g);
	const i = Math.min(N * N - 1, Math.max(0, Math.floor(p.y) * N + Math.floor(p.x)));
	// besoin du quartier : on regarde la case et ses voisines habitées
	const has = (k: keyof typeof c) => {
		for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
			const x = Math.floor(p.x) + dx, y = Math.floor(p.y) + dy;
			if (x < 0 || y < 0 || x >= N || y >= N) continue;
			if (c[k][y * N + x]) return true;
		}
		return false;
	};
	const low = g.map[i]?.low;
	const needs: string[] = [];
	if (g.budget < 0 && p.kind === 'agent') needs.push('Ça fait deux mois que je ne suis pas payé. La caisse de la mairie est vide.');
	if (g.tax === 2 && (p.kind === 'vendeuse' || p.kind === 'moto')) needs.push('Les taxes sont trop lourdes ! On ne gagne plus rien au marché.');
	if (!has('eau')) needs.push(p.kind === 'porteuse' ? 'Je marche loin pour l’eau chaque matin. Un forage ou une borne ici changerait tout.' : 'Il n’y a pas d’eau potable dans notre quartier. Les enfants tombent malades.');
	if (low && !has('drain')) needs.push(isRain(g) ? 'L’eau monte dans les cours ! Il nous faut des caniveaux.' : 'L’an dernier, l’eau est entrée dans la cour. Pensez aux caniveaux avant l’hivernage.');
	if (!has('edu')) needs.push(p.kind === 'eleve' ? 'Je marche une heure pour aller à l’école.' : 'Mes enfants n’ont pas d’école près d’ici.');
	if (!has('san')) needs.push('Le centre de santé est trop loin. Quand un enfant est malade, c’est la panique.');
	if (!has('dech')) needs.push('Les ordures s’entassent derrière chez nous. Les moustiques sont partout.');
	if (!has('lum')) needs.push('Sans lumière, on ne sort plus le soir.');
	if (p.kind === 'jeune' && !count(g, 'foot')) needs.push('On n’a nulle part où jouer au foot. On s’ennuie au grin.');
	if (needs.length) return needs[p.id % Math.min(2, needs.length)];
	const happy = [
		'I ni ce, Mèri ! Le quartier se porte bien.',
		has('eau') ? 'Avec l’eau tout près, la vie a changé.' : '',
		has('lum') ? 'Avec le lampadaire, on rentre tard sans crainte.' : '',
		has('com') ? 'Le marché est animé, les affaires marchent.' : '',
		p.kind === 'moto' ? 'Les routes sont bonnes, je livre plus vite.' : '',
		p.kind === 'doyen' ? 'J’ai vu cette commune grandir. Continuez comme ça.' : '',
		p.kind === 'eleve' ? 'J’aime mon école. Plus tard, je serai maire !' : ''
	].filter(Boolean);
	return happy[p.id % happy.length];
}
