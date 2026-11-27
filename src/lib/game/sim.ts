// Simulation pure (sans affichage) : carte, couverture des services, satisfaction, finances, tour mensuel.
import {
	B, N, POP, MONTHS, START_YEAR, MANDATE, TAX_MULT, TAX_CONF, CONFIRM_FROM, DEMOLIR,
	clamp, hash, money, type BKey, type Svc, type Tool
} from './config';

export interface Tile { t: 'l' | 'w'; low: boolean; bank: boolean; b: BKey | null; lvl: number; fl: number; v: number }
export interface Temp { k: 'sat' | 'mk'; v: number; n: number }
export interface Game {
	name: string; m: number; budget: number; conf: number; tax: number;
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

export function newGame(name: string): Game {
	const map: Tile[] = [];
	for (let y = 0; y < N; y++)
		for (let x = 0; x < N; x++) {
			const ry = 13 + Math.round(Math.sin(x * 0.6) * 1.2);
			map.push({ t: y >= ry ? 'w' : 'l', low: false, bank: false, b: null, lvl: 0, fl: 0, v: Math.floor(hash(x + 3, y + 7) * 4) });
		}
	for (let y = 0; y < N; y++)
		for (let x = 0; x < N; x++) {
			const t = map[idx(x, y)];
			if (t.t === 'w') continue;
			for (let dy = -2; dy <= 2; dy++)
				for (let dx = -2; dx <= 2; dx++) {
					const u = at(map, x + dx, y + dy);
					if (u && u.t === 'w') { t.low = true; if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) t.bank = true; }
				}
			if (hash(x, y) < 0.1 && (Math.abs(x - 7) > 3 || Math.abs(y - 6) > 3)) t.b = 'arbre';
		}
	const set = (x: number, y: number, b: BKey, l = 0) => { const t = map[idx(x, y)]; t.b = b; t.lvl = l; };
	for (let x = 2; x <= 13; x++) set(x, 6, 'route');
	for (let y = 1; y <= 11; y++) set(7, y, 'route');
	set(6, 5, 'mairie'); set(8, 7, 'marche');
	[[4, 5], [5, 5], [9, 5], [10, 7], [5, 7], [4, 7], [6, 11], [6, 10]].forEach(([x, y]) => set(x, y, 'house', 1));
	[[11, 5], [3, 7], [8, 10]].forEach(([x, y]) => set(x, y, 'lot'));
	return { name, m: 0, budget: 15, conf: 55, tax: 1, map, temp: [], log: [], tok: 0, cure: 0, over: null, mandat: 1, lastEv: '', tuto: 0, ver: 1 };
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
		if (t.b === 'depot') mark(c.nui, x, y, 1);
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

export interface Fin { imp: number; mk: number; ent: number; tr: number; net: number; rec: number }
export function finance(g: Game, st = stats(g)): Fin {
	const tm = TAX_MULT[g.tax], rec = 0.3 + 0.6 * g.conf / 100;
	const imp = st.pop * 0.006 * tm * rec;
	const nm = count(g, 'marche');
	const mk = nm ? (0.4 * Math.min(nm, 1 + Math.floor(st.pop / 300)) + 0.0012 * st.pop) * tm * (tempSum(g, 'mk') < 0 ? 0.5 : 1) : 0;
	let ent = 0;
	g.map.forEach((t) => { if (t.b) ent += B[t.b].maint; });
	const tr = g.m % 12 === 11 ? 3 + 0.004 * st.pop : 0;
	return { imp, mk, ent, tr, net: imp + mk + tr - ent, rec };
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
		return g.budget >= DEMOLIR.cost ? { ok: true, cost: DEMOLIR.cost } : { ok: false, cost: DEMOLIR.cost, reason: 'Budget insuffisant.' };
	}
	if (t.b === tool) return { ok: false, cost: 0 };
	if (t.b && t.b !== 'arbre') return { ok: false, cost: 0, reason: 'Case occupée : démolis d’abord.' };
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
			if (Math.random() < 0.3 * (g.cure ? 0.35 : 1)) {
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
