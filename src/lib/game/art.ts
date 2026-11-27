// Petits dessins pour l'interface : icônes d'outils, habitants en pied, planche de design.
import { TH, type BKey, type Tool } from './config';
import { ground, sprite, person, type View, type PKind, type Look } from './render';
import type { Tile } from './sim';

const noRoads = () => [] as [number, number][];

/** Dessine une case isométrique avec son bâtiment, centrée dans (w,h). */
export function drawTile(ctx: CanvasRenderingContext2D, w: number, h: number, key: BKey | null, lvl = 0, variant = 1, z?: number) {
	const zz = z ?? Math.min(w / 72, h / 72);
	const v: View = { ctx, z: zz, ox: w / 2, oy: h * 0.7 - (TH / 2) * zz };
	const t: Tile = { t: 'l', low: false, bank: false, b: key, lvl, fl: 0, v: variant };
	const roads = key === 'route' ? () => [[1, 0], [0, 1]] as [number, number][] : noRoads;
	ground(v, 0, 0, t, 0, { rain: false, time: null, layer: null, cov: null, roads });
	sprite(v, 0, 0, t);
}

export function drawToolIcon(ctx: CanvasRenderingContext2D, w: number, h: number, tool: Tool) {
	if (tool === 'voir') {
		ctx.strokeStyle = '#e8a33d'; ctx.lineWidth = w * 0.07; ctx.lineCap = 'round';
		ctx.beginPath(); ctx.arc(w * 0.44, h * 0.42, w * 0.17, 0, 7); ctx.stroke();
		ctx.beginPath(); ctx.moveTo(w * 0.56, h * 0.56); ctx.lineTo(w * 0.7, h * 0.74); ctx.stroke();
		return;
	}
	if (tool === 'demolir') {
		drawTile(ctx, w, h, null);
		ctx.strokeStyle = '#c2452d'; ctx.lineWidth = w * 0.08; ctx.lineCap = 'round';
		ctx.beginPath(); ctx.moveTo(w * 0.34, h * 0.32); ctx.lineTo(w * 0.66, h * 0.66); ctx.moveTo(w * 0.66, h * 0.32); ctx.lineTo(w * 0.34, h * 0.66); ctx.stroke();
		return;
	}
	drawTile(ctx, w, h, tool, 0, 1);
}

/** Un habitant en pied, grand format (planche de design, fiches). */
export function drawPerson(ctx: CanvasRenderingContext2D, w: number, h: number, kind: PKind, look: Look, walking = false, phase = 0.8) {
	const z = kind === 'sotrama' ? w / 26 : h / 29;
	const v: View = { ctx, z, ox: w / 2, oy: h * 0.86 - (kind === 'sotrama' ? 0 : 0) };
	// person() place le pied en P(v,x,y) : on vise le point (0,0) → (ox, oy)
	person(v, 0, 0, { kind, look, phase, moving: walking, dir: 1, axis: 'x', carry: true });
}
