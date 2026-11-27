// Simulation pure (sans affichage) : carte, couverture des services, satisfaction, finances, tour mensuel.
import { COMMUNES, type CommuneId } from './communes';
import {
	B, N, POP, MONTHS, START_YEAR, MANDATE, TAX_MULT, TAX_CONF, CONFIRM_FROM, DEMOLIR,
	clamp, hash, money, type BKey, type Svc, type Tool
} from './config';

export interface Tile { t: 'l' | 'w' | 'm'; low: boolean; bank: boolean; b: BKey | null; lvl: number; fl: number; v: number }
export interface Temp { k: 'sat' | 'mk'; v: number; n: number }
export interface Game {
	name: string; commune: CommuneId; m: number; budget: number; conf: number; tax: number;
	map: Tile[]; temp: Temp[]; log: string[]; tok: number; cure: number;
	over: null | 'del' | 'tut' | 'lost'; mandat: number; lastEv: string; tuto: number; ver: number;
}
export type Cov = Record<Svc | 'nui', Uint8Array>;

export const idx = (x: number, y: number) => y * N + x;
export const at = (m: Tile[], x: number, y: number) => (x >= 0 && y >= 0 && x < N && y < N ? m[y * N + x] : null);
export const dateStr = (g: Game) => MONTHS[g.m % 12] + ' ' + (START_YEAR + Math.floor(g.m / 12));
export const isRain = (g: Game) => { const o = g.m % 12; return o >= 5 && o <= 9; };
export const isStorm = (g: Game) => { const o = g.m % 12; return o >= 6 && o <= 8; };
export const season = (g: Game) => { const o = g.m % 12; return isRain(g) ? 'Hivernage' : o >= 2 && o <= 4 ? 'Saison chaude' : 'Saison froide'; };
export const count = (g: Game, b: BKey) => g.map.reduce((a, t) => a + (t.b === b ? 1 : 0), 0);
export const tempSum = (g: Game, k: Temp['k']) => g.temp.reduce((a, t) => a + (t.k === k ? t.v : 0), 0);
export const addTemp = (g: Game, k: Temp['k'], v: number, n: number) => { g.temp.push({ k, v, n }); };
export const monthsLeft = (g: Game) => MANDATE * g.mandat - g.m;

type XY = [number, number];
interface Layout {
	roads: [('h' | 'v'), number, number, number][]; // h : y, x0, x1 · v : x, y0, y1
	mairie: XY; marche?: XY; repere?: [BKey, XY][];
	h1: XY[]; h2?: XY[]; lots: XY[]; rail?: [number, number, number]; // y, x0, x1
}
const LAYOUTS: Record<CommuneId, Layout> = {
	benkadi: { roads: [['h', 6, 2, 13], ['v', 7, 1, 11]], mairie: [6, 5], marche: [8, 7],
		h1: [[4, 5], [5, 5], [9, 5], [10, 7], [5, 7], [4, 7], [6, 11], [6, 10]], lots: [[11, 5], [3, 7], [8, 10]] },
	koutiala: { roads: [['h', 6, 0, 15], ['v', 8, 0, 15], ['h', 3, 4, 12]], mairie: [7, 5], marche: [9, 7], repere: [['usine', [12, 5]]],
		h1: [[4, 5], [5, 5], [5, 7], [4, 7], [6, 7], [10, 5], [10, 7], [11, 7], [7, 2], [9, 2], [6, 4], [7, 9], [9, 10]], h2: [[9, 5], [7, 7], [9, 4]], lots: [[13, 7], [3, 5], [9, 9]] },
	segou: { roads: [['h', 7, 1, 11], ['v', 5, 1, 14], ['h', 11, 1, 13]], mairie: [4, 6], marche: [6, 8], repere: [['quai', [11, 8]]],
		h1: [[3, 6], [3, 8], [4, 8], [6, 6], [7, 6], [8, 8], [9, 6], [10, 6], [4, 10], [6, 10], [6, 12], [4, 12]], h2: [[2, 6], [8, 6]], lots: [[9, 8], [10, 10], [4, 2]] },
	koulikoro: { roads: [['h', 7, 1, 14], ['v', 9, 4, 11]], mairie: [8, 6], marche: [10, 8], repere: [['gare', [9, 3]], ['quai', [10, 11]]], rail: [3, 0, 8],
		h1: [[6, 6], [7, 6], [5, 8], [6, 8], [11, 6], [12, 6], [12, 8], [8, 8], [8, 10], [10, 10]], h2: [[4, 6]], lots: [[13, 8], [3, 8], [8, 4]] },
	bougouni: { roads: [['h', 7, 0, 15], ['v', 7, 1, 15], ['h', 10, 3, 12]], mairie: [6, 6], marche: [8, 8], repere: [['camions', [13, 8]]],
		h1: [[5, 6], [4, 6], [8, 6], [9, 6], [5, 8], [6, 8], [9, 8], [4, 9], [6, 11], [8, 11]], h2: [[10, 6], [6, 9]], lots: [[11, 9], [12, 6], [3, 8]] },
	sirakorola: { roads: [['h', 7, 0, 15], ['v', 3, 2, 6], ['v', 12, 8, 13]], mairie: [7, 6], repere: [['grenier', [8, 8]]],
		h1: [[6, 6], [8, 6], [9, 6], [6, 8], [7, 8], [5, 6], [2, 3], [4, 3], [2, 5], [4, 5], [11, 10], [13, 10], [11, 12], [13, 12]], lots: [[9, 8], [4, 2]] }
};

export function newGame(id: CommuneId = 'benkadi'): Game {
	const C = COMMUNES[id] ?? COMMUNES.benkadi;
	const L = LAYOUTS[C.id];
	const riverS = (x: number) => 13 + Math.round(Math.sin(x * 0.6) * 1.2);
	const riverE = (y: number) => 13 + Math.round(Math.sin(y * 0.6 + 1) * 1.2);
	const isW = (x: number, y: number) => (C.id === 'segou' ? x >= riverE(y) : C.id === 'koulikoro' || C.id === 'benkadi' ? y >= riverS(x) : false);
	const map: Tile[] = [];
	for (let y = 0; y < N; y++)
		for (let x = 0; x < N; x++)
			map.push({ t: isW(x, y) ? 'w' : 'l', low: false, bank: false, b: null, lvl: 0, fl: 0, v: Math.floor(hash(x + 3, y + 7) * 4) });
	// marigot (saisonnier) ou mare
	const mar = (ax: number, ay: number, bx: number, by: number) => {
		for (let k = 0; k <= 60; k++) {
			const f = k / 60, x = Math.round(ax + (bx - ax) * f), y = Math.round(ay + (by - ay) * f + Math.sin(f * 9) * 0.7);
			const t = at(map, x, y);
			if (t && t.t === 'l') t.t = 'm';
		}
	};
	if (C.id === 'koutiala') mar(0, 12, 15, 9);
	if (C.id === 'bougouni') mar(0, 12, 15, 14);
	if (C.id === 'sirakorola') ([[11, 2], [12, 2], [11, 3], [12, 3]] as XY[]).forEach(([x, y]) => { map[idx(x, y)].t = 'm'; });
	const density = C.id === 'segou' || C.id === 'bougouni' ? 0.15 : 0.1;
	for (let y = 0; y < N; y++)
		for (let x = 0; x < N; x++) {
			const t = map[idx(x, y)];
			if (t.t !== 'l') continue;
			for (let dy = -2; dy <= 2; dy++)
				for (let dx = -2; dx <= 2; dx++) {
					const u = at(map, x + dx, y + dy);
					if (u && u.t !== 'l') { t.low = true; if (u.t === 'w' && Math.abs(dx) <= 1 && Math.abs(dy) <= 1) t.bank = true; }
				}
			if (hash(x, y) < density && (Math.abs(x - 7) > 3 || Math.abs(y - 6) > 3)) {
				t.b = 'arbre';
				t.v = hash(y + 5, x + 1) < 0.65 ? C.arbre : Math.floor(hash(x + 9, y) * 4);
			}
		}
	const set = (x: number, y: number, b: BKey, l = 0) => {
		const t = at(map, x, y);
		if (!t || t.t === 'w' || (t.t === 'm' && b !== 'route')) return;
		t.b = b; t.lvl = l;
		if (b === 'arbre') return;
		t.v = Math.floor(hash(x + 3, y + 7) * 4);
	};
	for (const [k, a, b0, b1] of L.roads) for (let q = b0; q <= b1; q++) (k === 'h' ? set(q, a, 'route') : set(a, q, 'route'));
	if (L.rail) for (let x = L.rail[1]; x <= L.rail[2]; x++) set(x, L.rail[0], 'rail');
	set(L.mairie[0], L.mairie[1], 'mairie');
	if (C.id === 'segou') map[idx(L.mairie[0], L.mairie[1])].v = 9; // mairie de style néo-soudanais
	if (L.marche) set(L.marche[0], L.marche[1], 'marche');
	L.repere?.forEach(([b, [x, y]]) => { set(x, y, b); if (b === 'quai') map[idx(x, y)].v = C.id === 'segou' ? 0 : 1; });
	L.h1.forEach(([x, y]) => set(x, y, 'house', 1));
	L.h2?.forEach(([x, y]) => set(x, y, 'house', 2));
	L.lots.forEach(([x, y]) => set(x, y, 'lot'));
	// Campagne : champs autour des villages
	if (C.profil === 'rurale') {
		const busy = (x: number, y: number) => {
			for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const u = at(map, x + dx, y + dy); if (u?.b && u.b !== 'arbre' && u.b !== 'champ') return true; }
			return false;
		};
		for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
			const t = map[idx(x, y)];
			if (t.t === 'l' && !t.b && !busy(x, y) && hash(x * 3, y * 5) > 0.35) { t.b = 'champ'; t.v = Math.floor(hash(x, y * 2) * 3); }
		}
	}
	return { name: C.nom, commune: C.id, m: 0, budget: C.budget, conf: C.conf, tax: 1, map, temp: [], log: [], tok: 0, cure: 0, over: null, mandat: 1, lastEv: '', tuto: 0, ver: 1 };
}

// ---------- Couverture des services (mise en cache par version de carte) ----------
let covCache: { ver: number; g: Game; c: Cov } | null = null;
function mark(a: Uint8Array, x: number, y: number, r: number) {
	for (let dy = -r; dy <= r; dy++)
		for (let dx = -r; dx <= r; dx++) {
			const X = x + dx, Y = y + dy;
			if (X >= 0 && Y >= 0 && X < N && Y < N) a[Y * N + X] = 1;
		}
}
export function coverage(g: Game): Cov {
	if (covCache && covCache.g === g && covCache.ver === g.ver) return covCache.c;
	const keys: (Svc | 'nui')[] = ['eau', 'edu', 'san', 'dech', 'lum', 'loi', 'com', 'omb', 'drain', 'nui'];
	const c = Object.fromEntries(keys.map((k) => [k, new Uint8Array(N * N)])) as Cov;
	g.map.forEach((t, i) => {
		if (!t.b) return;
		const d = B[t.b];
		const x = i % N, y = (i / N) | 0;
		if (d.r && d.svc) mark(c[d.svc], x, y, d.r);
		if (d.nuis || t.b === 'depot') mark(c.nui, x, y, 1);
	});
	covCache = { ver: g.ver, g, c };
	return c;
}
export const changed = (g: Game) => { g.ver++; };

export function roadAdj(g: Game, i: number) {
	const x = i % N, y = (i / N) | 0;
	return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => at(g.map, x + a, y + b)?.b === 'route');
}

export function sat(g: Game, i: number, c = coverage(g)) {
	let s = 40;
	const t = g.map[i];
	if (c.eau[i]) s += 18; if (c.edu[i]) s += 10; if (c.san[i]) s += 10; if (c.dech[i]) s += 7;
	if (c.lum[i]) s += 5; if (c.loi[i]) s += 5; if (c.com[i]) s += 5; if (c.omb[i]) s += 3;
	if (c.nui[i]) s -= 12; if (!roadAdj(g, i)) s -= 20; if (t.fl > 0) s -= 20;
	return clamp(s + tempSum(g, 'sat'), 0, 100);
}

export interface Stats { pop: number; sat: number; wat: number }
export function stats(g: Game): Stats {
	const c = coverage(g);
	let pop = 0, ss = 0, wat = 0;
	g.map.forEach((t, i) => {
		if (t.b !== 'house') return;
		const p = POP[t.lvl];
		pop += p; ss += sat(g, i, c) * p; if (c.eau[i]) wat += p;
	});
	return { pop, sat: pop ? ss / pop : 50, wat: pop ? wat / pop : 0 };
}

export interface Fin { imp: number; mk: number; loc: number; ent: number; tr: number; net: number; rec: number }
export function finance(g: Game, st = stats(g)): Fin {
	const C = COMMUNES[g.commune] ?? COMMUNES.benkadi;
	const tm = TAX_MULT[g.tax] * C.taxe, rec = 0.3 + 0.6 * g.conf / 100;
	const imp = st.pop * 0.006 * tm * rec;
	const nm = count(g, 'marche');
	const mk = nm ? (0.4 * Math.min(nm, 1 + Math.floor(st.pop / 300)) + 0.0012 * st.pop) * tm * (tempSum(g, 'mk') < 0 ? 0.5 : 1) : 0;
	let ent = 0, loc = 0;
	g.map.forEach((t) => { if (t.b) { ent += B[t.b].maint; loc += B[t.b].income ?? 0; } });
	loc *= TAX_MULT[g.tax];
	const tr = g.m % 12 === 11 ? (3 + 0.004 * st.pop) * C.dotation : 0;
	return { imp, mk, loc, ent, tr, net: imp + mk + loc + tr - ent, rec };
}

// ---------- Construction ----------
export interface Check { ok: boolean; cost: number; reason?: string; confirm?: boolean; free?: boolean }
export function check(g: Game, i: number, tool: Tool): Check {
	const t = g.map[i];
	if (!t || g.over) return { ok: false, cost: 0 };
	if (tool === 'voir') return { ok: false, cost: 0 };
	if (t.t === 'w') return { ok: false, cost: 0, reason: 'On ne construit pas sur le fleuve !' };
	if (tool === 'demolir') {
		if (!t.b) return { ok: false, cost: 0 };
		if (t.b === 'mairie') return { ok: false, cost: 0, reason: 'La mairie reste debout.' };
		if (B[t.b].fixed) return { ok: false, cost: 0, reason: `${B[t.b].label} : un repère de la commune, on le garde.` };
		return g.budget >= DEMOLIR.cost ? { ok: true, cost: DEMOLIR.cost } : { ok: false, cost: DEMOLIR.cost, reason: 'Budget insuffisant.' };
	}
	if (t.t === 'm' && tool !== 'route') return { ok: false, cost: 0, reason: 'Lit du marigot : seule une route (un radier) peut le traverser.' };
	if (t.b === tool) return { ok: false, cost: 0 };
	if (t.b && t.b !== 'arbre' && t.b !== 'champ') return { ok: false, cost: 0, reason: 'Case occupée : démolis d’abord.' };
	const free = tool === 'forage' && g.tok > 0;
	const cost = free ? 0 : B[tool].cost + (t.b === 'arbre' ? 0.05 : 0);
	if (cost > g.budget) return { ok: false, cost, reason: `Il manque ${money(cost - g.budget)} pour construire.` };
	return { ok: true, cost, free, confirm: cost >= CONFIRM_FROM };
}
export function place(g: Game, i: number, tool: Tool): boolean {
	const ck = check(g, i, tool);
	if (!ck.ok) return false;
	const t = g.map[i];
	g.budget -= ck.cost;
	if (tool === 'demolir') { t.b = null; t.lvl = 0; t.fl = 0; }
	else { if (ck.free) g.tok--; t.b = tool as BKey; t.lvl = 0; }
	changed(g);
	return true;
}

// ---------- Tour mensuel ----------
export interface TickResult { month: string; net: number; msgs: string[]; tr: number }
export function tick(g: Game): TickResult {
	const c = coverage(g), mo = g.m % 12, msgs: string[] = [];
	g.map.forEach((t, i) => {
		if (t.fl > 0) t.fl--;
		if (t.b === 'lot') {
			if (roadAdj(g, i) && g.conf > 20 && Math.random() < 0.45) { t.b = 'house'; t.lvl = 1; }
		} else if (t.b === 'house') {
			const s = sat(g, i, c);
			if (t.lvl === 1 && s >= 58 && c.eau[i] && Math.random() < 0.3) t.lvl = 2;
			else if (t.lvl === 2 && s >= 72 && c.eau[i] && c.edu[i] && c.san[i] && Math.random() < 0.18) t.lvl = 3;
			else if (s < 30 && Math.random() < 0.15) { t.lvl--; if (!t.lvl) t.b = 'lot'; }
		}
	});
	if (mo >= 6 && mo <= 8) {
		let n = 0, k = 0;
		g.map.forEach((t, i) => {
			if (t.b !== 'house' || !t.low || c.drain[i]) return;
			if (Math.random() < 0.3 * (COMMUNES[g.commune]?.pluie ?? 1) * (g.cure ? 0.35 : 1)) {
				t.fl = 3; n++;
				if (t.lvl === 1 && Math.random() < 0.35) { t.b = 'lot'; t.lvl = 0; k++; }
			}
		});
		if (n) { msgs.push(`Inondation : ${n} concession${n > 1 ? 's' : ''} sous l’eau${k ? `, ${k} effondrée${k > 1 ? 's' : ''}` : ''}.`); g.conf -= Math.min(6, n); }
	}
	if (mo === 9) g.cure = 0;
	changed(g);
	const st = stats(g), f = finance(g, st);
	g.budget += f.net;
	g.conf += (st.sat - g.conf) * 0.12 + TAX_CONF[g.tax];
	if (g.budget < 0) { g.conf -= 1.5; msgs.push('Caisse vide : les agents de la mairie ne sont pas payés.'); }
	g.conf = clamp(g.conf, 0, 100);
	g.temp = g.temp.filter((x) => --x.n > 0);
	if (f.tr) msgs.push(`Dotation annuelle de l’État : +${money(f.tr)}.`);
	log(g, `${MONTHS[mo]} : ${f.net >= 0 ? '+' : ''}${money(f.net)}. ${msgs.join(' ')}`);
	g.m++;
	if (g.conf < 10) g.over = 'del';
	else if (g.budget < -5) g.over = 'tut';
	return { month: MONTHS[mo], net: f.net, msgs, tr: f.tr };
}
export function log(g: Game, t: string) { g.log.push(t); if (g.log.length > 60) g.log.shift(); }

export function objectives(g: Game): [string, boolean, string][] {
	const s = stats(g);
	return [
		['Atteindre 400 habitants', s.pop >= 400, `${s.pop} / 400`],
		['Construire une école', count(g, 'ecole') > 0, ''],
		['Construire un CSCom', count(g, 'cscom') > 0, ''],
		['Donner l’eau potable à 80 % des habitants', s.wat >= 0.8, Math.round(s.wat * 100) + ' %'],
		['Satisfaction moyenne de 65 % ou plus', s.sat >= 65, Math.round(s.sat) + ' %'],
		['Garder au moins 50 % de confiance pour les élections', g.conf >= 50, Math.round(g.conf) + ' %']
	];
}
