// État de l'interface (réactif) + actions. L'objet de jeu lui-même reste « simple » (non réactif)
// pour que le rendu canvas à 60 images/s ne paie pas le coût des proxys ; `ui.rev` signale les changements.
import { B, MANDATE, type Tool } from './config';
import { newGame, tick, place, check, stats, log, type Game } from './sim';
import { pickEvent, type GEvent } from './events';
import { People } from './people';

const KEY = 'meri-save-v2';

export const game: { g: Game | null } = { g: null };
export const people = new People();

export type Modal =
	| null
	| { kind: 'start' }
	| { kind: 'event'; ev: GEvent }
	| { kind: 'objectives' }
	| { kind: 'journal' }
	| { kind: 'election'; win: boolean; pop: number; sat: number }
	| { kind: 'end' }
	| { kind: 'menu' }
	| { kind: 'design' }
	| { kind: 'confirmNew' };
export type Sheet =
	| null
	| { kind: 'tile'; i: number }
	| { kind: 'tool' }
	| { kind: 'confirm'; i: number }
	| { kind: 'person'; id: number }
	| { kind: 'finance' };

export const ui = $state({
	rev: 0,
	tool: 'voir' as Tool,
	cat: null as string | null,
	sheet: null as Sheet,
	modal: { kind: 'start' } as Modal,
	toast: '',
	toastN: 0,
	layer: 0,
	speed: 0,
	sel: -1,
	pending: -1
});

export const bump = () => { ui.rev++; };
export function toast(t: string) { ui.toast = t; ui.toastN++; }
const buzz = (ms = 12) => { try { navigator.vibrate?.(ms); } catch { /* pas de vibreur */ } };

export function save() { try { if (game.g) localStorage.setItem(KEY, JSON.stringify(game.g)); } catch { /* stockage indisponible */ } }
export function load(): boolean {
	try {
		const s = localStorage.getItem(KEY);
		if (!s) return false;
		const g = JSON.parse(s) as Game;
		if (!g.map || g.over) return false;
		game.g = g; people.reset(); ui.modal = null; bump();
		return true;
	} catch { return false; }
}
export function clearSave() { try { localStorage.removeItem(KEY); } catch { /* rien */ } }

export function start(name: string) {
	game.g = newGame(name.trim() || 'Bènkadi');
	log(game.g, `Installation du conseil communal de ${game.g.name}.`);
	people.reset();
	ui.modal = null; ui.sheet = null; ui.tool = 'voir'; ui.cat = null; ui.sel = -1; ui.pending = -1; ui.speed = 0;
	save(); bump();
}
export function skipTuto() { if (game.g) { game.g.tuto = -1; save(); bump(); } }

export function selectTool(t: Tool) {
	ui.tool = t; ui.pending = -1;
	ui.sheet = t === 'voir' ? null : { kind: 'tool' };
	bump();
}

let lastFail = 0;
export function applyAt(i: number, painting = false) {
	const g = game.g;
	if (!g || g.over) return;
	ui.sel = i;
	const tool = ui.tool;
	if (tool === 'voir') { ui.sheet = { kind: 'tile', i }; ui.pending = -1; bump(); return; }
	const ck = check(g, i, tool);
	if (!ck.ok) {
		if (ck.reason && (!painting || performance.now() - lastFail > 1500)) { toast(ck.reason); lastFail = performance.now(); }
		bump(); return;
	}
	if (ck.confirm && !painting) { ui.pending = i; ui.sheet = { kind: 'confirm', i }; bump(); return; }
	build(i);
}
export function build(i: number) {
	const g = game.g;
	if (!g) return;
	const tool = ui.tool;
	if (!place(g, i, tool)) return;
	buzz();
	ui.pending = -1;
	if (tool !== 'demolir' && !B[tool as keyof typeof B]?.brush) { ui.sheet = { kind: 'tile', i }; toast(`${B[tool as keyof typeof B].label} construit.`); }
	else if (ui.sheet?.kind === 'confirm') ui.sheet = { kind: 'tool' };
	// tutoriel
	if (g.tuto === 0 && tool === 'route') g.tuto = 1;
	else if (g.tuto === 1 && tool === 'lot') g.tuto = 2;
	else if (g.tuto === 2 && (tool === 'forage' || tool === 'borne')) g.tuto = 3;
	save(); bump();
}
export function cancelPending() { ui.pending = -1; ui.sheet = ui.tool === 'voir' ? null : { kind: 'tool' }; bump(); }

export function nextMonth() {
	const g = game.g;
	if (!g || g.over || ui.modal) return;
	const r = tick(g);
	toast(`${r.month} : ${r.net >= 0 ? '+' : ''}${r.net.toFixed(1).replace('.', ',')} M${r.msgs[0] ? ' · ' + r.msgs[0] : ''}`);
	if (g.tuto === 3) { g.tuto = 4; }
	save();
	if (g.over) { ui.speed = 0; ui.modal = { kind: 'end' }; bump(); return; }
	if (g.m === MANDATE * g.mandat) {
		const st = stats(g), win = g.conf >= 50;
		if (!win) g.over = 'lost';
		ui.speed = 0; ui.modal = { kind: 'election', win, pop: st.pop, sat: st.sat }; save(); bump(); return;
	}
	const ev = pickEvent(g);
	if (ev) { g.lastEv = ev.id; setTimeout(() => { ui.modal = { kind: 'event', ev }; bump(); }, 350); }
	bump();
}
export function choose(ev: GEvent, k: number) {
	const g = game.g;
	if (!g) return;
	const ch = ev.choices[k];
	const msg = ch.run(g);
	g.conf = Math.max(0, Math.min(100, g.conf));
	log(g, `${ev.title} : ${ch.label}.`);
	ui.modal = null;
	if (msg) toast(msg);
	if (g.conf < 10) { g.over = 'del'; ui.modal = { kind: 'end' }; }
	g.ver++; save(); bump();
}
export function nextMandate() { if (game.g) { game.g.mandat++; ui.modal = null; save(); bump(); } }
export function newGamePrompt() { clearSave(); ui.modal = { kind: 'start' }; bump(); }
export function cycleTax() { if (!game.g) return; game.g.tax = (game.g.tax + 1) % 3; save(); bump(); }
export function setTax(t: number) { if (!game.g) return; game.g.tax = t; save(); bump(); }
export function cycleLayer() { ui.layer = (ui.layer + 1) % 5; bump(); }
