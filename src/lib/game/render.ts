// Rendu isométrique sur Canvas 2D : sol, bâtiments, habitants, portraits.
// Tout est dessiné en code (pas d'images) : léger, net à toutes les échelles, facile à varier.
import { TW, TH, N, B, hash, type BKey, type Svc } from './config';
import type { Tile } from './sim';

export interface View { ctx: CanvasRenderingContext2D; z: number; ox: number; oy: number }
type Pt = [number, number];

export const P = (v: View, x: number, y: number): Pt => [v.ox + ((x - y) * TW) / 2 * v.z, v.oy + ((x + y) * TH) / 2 * v.z];

// ---------- Couleurs ----------
const hex2 = (h: string) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
export const mix = (a: string, b: string, f: number) => {
	const A = hex2(a), C = hex2(b);
	return '#' + A.map((x, i) => Math.round(x + (C[i] - x) * f).toString(16).padStart(2, '0')).join('');
};
export const shade = (h: string, f: number) => (f < 0 ? mix(h, '#000000', -f) : mix(h, '#ffffff', f));
export const SKIN = ['#5c3a22', '#6e4528', '#4b2e1b', '#7a4e2e'];
export const WAX = ['#e8a33d', '#c2452d', '#2f7d8c', '#6a9b3c', '#8a3b8f', '#d9631e', '#1f5fa8'];

// ---------- Primitives ----------
function poly(c: CanvasRenderingContext2D, pts: Pt[], col: string) {
	c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
	for (let k = 1; k < pts.length; k++) c.lineTo(pts[k][0], pts[k][1]);
	c.closePath(); c.fillStyle = col; c.fill();
}
const dia = (v: View, cx: number, cy: number, h: number): Pt[] => [P(v, cx - h, cy - h), P(v, cx + h, cy - h), P(v, cx + h, cy + h), P(v, cx - h, cy + h)];

/** Boîte isométrique centrée sur (cx,cy) en coordonnées de case, demi-tailles hx/hy, hauteur h, base b (pixels à l'échelle 1). */
export function box(v: View, cx: number, cy: number, hx: number, hy: number, h: number, b: number, col: string, top?: string) {
	const c = v.ctx, z = v.z;
	const A = P(v, cx - hx, cy - hy), Bq = P(v, cx + hx, cy - hy), C = P(v, cx + hx, cy + hy), D = P(v, cx - hx, cy + hy);
	const l = b * z, u = (b + h) * z;
	poly(c, [[D[0], D[1] - l], [C[0], C[1] - l], [C[0], C[1] - u], [D[0], D[1] - u]], shade(col, -0.16));
	poly(c, [[C[0], C[1] - l], [Bq[0], Bq[1] - l], [Bq[0], Bq[1] - u], [C[0], C[1] - u]], shade(col, -0.32));
	poly(c, [[A[0], A[1] - u], [Bq[0], Bq[1] - u], [C[0], C[1] - u], [D[0], D[1] - u]], top ?? shade(col, 0.08));
}
/** Rectangle peint sur une face (L = face avant-gauche, R = face avant-droite) : portes, fenêtres. */
function face(v: View, cx: number, cy: number, hx: number, hy: number, side: 'L' | 'R', u0: number, u1: number, h0: number, h1: number, col: string) {
	const q = (u: number): Pt => side === 'L' ? P(v, cx - hx + 2 * hx * u, cy + hy) : P(v, cx + hx, cy + hy - 2 * hy * u);
	const a = q(u0), b = q(u1), z = v.z;
	poly(v.ctx, [[a[0], a[1] - h0 * z], [b[0], b[1] - h0 * z], [b[0], b[1] - h1 * z], [a[0], a[1] - h1 * z]], side === 'L' ? col : shade(col, -0.2));
}
function windows(v: View, cx: number, cy: number, hx: number, hy: number, side: 'L' | 'R', n: number, h0: number, h1: number, col: string, skip = -1) {
	for (let k = 0; k < n; k++) {
		if (k === skip) continue;
		const w = 1 / n, u0 = k * w + w * 0.28, u1 = (k + 1) * w - w * 0.28;
		face(v, cx, cy, hx, hy, side, u0, u1, h0, h1, col);
	}
}
function shadow(v: View, cx: number, cy: number, r: number, a = 0.2) {
	const p = P(v, cx + 0.06, cy + 0.06);
	v.ctx.fillStyle = `rgba(40,20,5,${a})`;
	v.ctx.beginPath(); v.ctx.ellipse(p[0], p[1], r * TW / 2 * v.z * 1.2, r * TH / 2 * v.z * 1.2, 0, 0, 7); v.ctx.fill();
}
function flag(v: View, cx: number, cy: number, b: number) {
	const p = P(v, cx, cy), c = v.ctx, z = v.z, y0 = p[1] - (b + 14) * z;
	c.strokeStyle = '#5a5a5a'; c.lineWidth = Math.max(1, z * 1.1);
	c.beginPath(); c.moveTo(p[0], p[1] - b * z); c.lineTo(p[0], y0); c.stroke();
	['#14b53a', '#fcd116', '#ce1126'].forEach((k, j) => { c.fillStyle = k; c.fillRect(p[0] + j * 3.6 * z, y0, 3.6 * z, 7 * z); });
}
function tree(v: View, cx: number, cy: number, kind: number) {
	const c = v.ctx, z = v.z, p = P(v, cx, cy);
	if (kind === 3) { // baobab
		shadow(v, cx, cy, 0.28);
		box(v, cx, cy, 0.07, 0.07, 15, 0, '#8d7b68');
		c.strokeStyle = '#7a6a58'; c.lineWidth = 2 * z;
		c.beginPath();
		c.moveTo(p[0], p[1] - 14 * z); c.lineTo(p[0] - 9 * z, p[1] - 22 * z);
		c.moveTo(p[0], p[1] - 14 * z); c.lineTo(p[0] + 8 * z, p[1] - 23 * z);
		c.moveTo(p[0], p[1] - 15 * z); c.lineTo(p[0] + 1 * z, p[1] - 25 * z);
		c.stroke();
		c.fillStyle = '#7d9a45';
		[[-9, -23, 4], [8, -24, 4.5], [1, -26, 3.5]].forEach(([dx, dy, r]) => { c.beginPath(); c.ellipse(p[0] + dx * z, p[1] + dy * z, r * z * 1.3, r * z, 0, 0, 7); c.fill(); });
		return;
	}
	shadow(v, cx, cy, 0.24);
	box(v, cx, cy, 0.03, 0.03, 10, 0, '#6b4a2b');
	const big = kind === 2;
	c.fillStyle = big ? '#3f6e2c' : kind ? '#5b8c3a' : '#4a7a33';
	c.beginPath(); c.ellipse(p[0], p[1] - (big ? 19 : 17) * z, (big ? 14 : 12) * z, (big ? 11 : 9) * z, 0, 0, 7); c.fill();
	c.fillStyle = 'rgba(255,255,220,.16)';
	c.beginPath(); c.ellipse(p[0] - 3 * z, p[1] - (big ? 23 : 20) * z, 6 * z, 4 * z, 0, 0, 7); c.fill();
	if (big) { c.fillStyle = '#e8a33d'; [[-5, -15], [4, -14], [7, -20]].forEach(([dx, dy]) => { c.beginPath(); c.arc(p[0] + dx * z, p[1] + dy * z, 1.4 * z, 0, 7); c.fill(); }); }
}

// ---------- Sol ----------
export interface GroundOpt { rain: boolean; time: number | null; layer: Svc | null; cov: Record<string, Uint8Array> | null; roads: (i: number) => [number, number][] }
export function ground(v: View, x: number, y: number, t: Tile, i: number, o: GroundOpt) {
	const c = v.ctx, cx = x + 0.5, cy = y + 0.5, h = hash(x, y);
	let col: string;
	if (t.t === 'w') col = mix('#3d8fb8', '#2f7aa3', h);
	else {
		col = mix(t.low ? '#c39a5e' : '#d9a462', t.low ? '#b48d55' : '#cf9655', h);
		if (t.bank && !t.b) col = mix('#e3c38d', '#d8b47a', h);
		if (o.rain) col = mix(col, '#8fae55', t.bank ? 0.25 : t.low ? 0.55 : 0.33);
	}
	if (t.b === 'route') col = mix('#a05b37', '#94532f', h);
	if (t.b === 'foot') col = '#5f9c45';
	const d = dia(v, cx, cy, 0.5);
	poly(c, d, col);
	c.strokeStyle = 'rgba(60,30,10,.08)'; c.lineWidth = 1; c.stroke();
	if (t.t === 'w' && o.time != null) {
		const s = Math.sin(o.time / 700 + x * 1.3 + y) * 0.5 + 0.5, a = P(v, cx - 0.25, cy), b = P(v, cx + 0.1, cy - 0.2);
		c.strokeStyle = `rgba(255,255,255,${0.12 + 0.2 * s})`; c.lineWidth = 1.5 * v.z;
		c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
	}
	if (t.b === 'route') {
		const nb = o.roads(i);
		if (!nb.length) poly(c, dia(v, cx, cy, 0.16), '#b8724a');
		for (const [dx, dy] of nb) {
			const px = -dy * 0.15, py = dx * 0.15, ex = cx + dx * 0.5, ey = cy + dy * 0.5;
			poly(c, [P(v, cx + px, cy + py), P(v, ex + px, ey + py), P(v, ex - px, ey - py), P(v, cx - px, cy - py)], '#b8724a');
		}
		if (nb.length) poly(c, dia(v, cx, cy, 0.15), '#b8724a');
	}
	if (t.b === 'caniveau') {
		poly(c, dia(v, cx, cy, 0.36), '#8d8a82'); poly(c, dia(v, cx, cy, 0.24), '#4f5d63');
		const a = P(v, cx - 0.2, cy - 0.2), b = P(v, cx + 0.2, cy + 0.2);
		c.strokeStyle = '#5fa8d3'; c.lineWidth = 2 * v.z; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
	}
	if (t.b === 'foot') {
		c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.2 * v.z;
		const q = dia(v, cx, cy, 0.42);
		c.beginPath(); q.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.stroke();
		const a = P(v, cx, cy - 0.42), b = P(v, cx, cy + 0.42), m = P(v, cx, cy);
		c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
		c.beginPath(); c.ellipse(m[0], m[1], 7 * v.z, 3.5 * v.z, 0, 0, 7); c.stroke();
	}
	if (t.b === 'lot') {
		c.setLineDash([3 * v.z, 3 * v.z]); c.strokeStyle = '#6b4a2b'; c.lineWidth = 1.3 * v.z;
		const q = dia(v, cx, cy, 0.4);
		c.beginPath(); q.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.stroke(); c.setLineDash([]);
	}
	if (t.b === 'forage') { const p = P(v, cx + 0.12, cy + 0.2); c.fillStyle = 'rgba(61,127,196,.35)'; c.beginPath(); c.ellipse(p[0], p[1], 9 * v.z, 4 * v.z, 0, 0, 7); c.fill(); }
	if (o.rain && t.low && !t.b && t.t === 'l' && h > 0.45) {
		const p = P(v, cx + (h - 0.5) * 0.4, cy - (h - 0.5) * 0.3);
		c.fillStyle = 'rgba(80,140,190,.45)'; c.beginPath(); c.ellipse(p[0], p[1], 8 * v.z, 3.5 * v.z, 0, 0, 7); c.fill();
	}
	if (o.layer && o.cov && t.t !== 'w') {
		const cv = o.cov[o.layer][i];
		if (o.layer === 'drain') { if (t.low) poly(c, d, cv ? 'rgba(47,160,90,.38)' : 'rgba(194,40,30,.4)'); }
		else poly(c, d, cv ? 'rgba(47,160,90,.36)' : 'rgba(194,69,45,.22)');
	}
	if (t.fl > 0) { const p = P(v, cx, cy); c.fillStyle = 'rgba(70,140,205,.6)'; c.beginPath(); c.ellipse(p[0], p[1], 0.46 * TW / 2 * v.z, 0.46 * TH / 2 * v.z, 0, 0, 7); c.fill(); }
}

// ---------- Bâtiments ----------
const WALL2 = ['#dcc9a3', '#e2c08f', '#e4c3b0', '#cfd6b0'];
const DOOR = ['#2f7d8c', '#3d6db3', '#6a9b3c', '#c2452d'];
const BAL = ['#2f7d8c', '#c2452d', '#3d6db3', '#d9a21b'];
const GLASS = '#3a3530';

export function sprite(v: View, x: number, y: number, t: { b: BKey | null; lvl: number; v: number }, warn = false, time = 0) {
	const cx = x + 0.5, cy = y + 0.5, c = v.ctx, z = v.z, vv = t.v;
	switch (t.b) {
		case 'house': {
			shadow(v, cx, cy, 0.42);
			if (t.lvl === 1) {
				const col = vv % 2 ? '#9e5f33' : '#a8683a';
				box(v, cx - 0.06, cy - 0.1, 0.22, 0.2, 11, 0, col, vv === 0 ? '#9aa0a6' : undefined);
				face(v, cx - 0.06, cy - 0.1, 0.22, 0.2, 'L', 0.55, 0.78, 0, 7, '#3a2416');
				face(v, cx - 0.06, cy - 0.1, 0.22, 0.2, 'R', 0.35, 0.58, 5, 8, '#3a2416');
				box(v, cx + 0.25, cy - 0.22, 0.1, 0.09, 7, 0, '#8f5530');
				box(v, cx - 0.04, cy + 0.36, 0.36, 0.025, 4, 0, col);
				box(v, cx + 0.36, cy + 0.05, 0.025, 0.3, 4, 0, col);
			} else if (t.lvl === 2) {
				const w = WALL2[vv];
				box(v, cx, cy, 0.3, 0.3, 15, 0, w);
				face(v, cx, cy, 0.3, 0.3, 'L', 0.42, 0.6, 0, 9, DOOR[vv]);
				face(v, cx, cy, 0.3, 0.3, 'L', 0.12, 0.28, 6, 11, GLASS);
				face(v, cx, cy, 0.3, 0.3, 'L', 0.72, 0.88, 6, 11, GLASS);
				windows(v, cx, cy, 0.3, 0.3, 'R', 2, 6, 11, GLASS);
				box(v, cx, cy, 0.31, 0.31, 2, 15, shade(w, -0.12));
				box(v, cx + 0.12, cy - 0.12, 0.06, 0.06, 6, 17, '#2b2b2b');
			} else {
				const w = '#e9dcbf';
				box(v, cx, cy, 0.33, 0.33, 13, 0, w);
				face(v, cx, cy, 0.33, 0.33, 'L', 0.42, 0.58, 0, 9, DOOR[vv]);
				windows(v, cx, cy, 0.33, 0.33, 'L', 4, 5, 10, GLASS, 1);
				windows(v, cx, cy, 0.33, 0.33, 'R', 3, 5, 10, GLASS);
				box(v, cx, cy, 0.37, 0.37, 2.5, 13, BAL[vv]);
				box(v, cx, cy, 0.31, 0.31, 14, 15.5, '#efe4ca');
				windows(v, cx, cy, 0.31, 0.31, 'L', 3, 19, 25, GLASS);
				windows(v, cx, cy, 0.31, 0.31, 'R', 3, 19, 25, GLASS);
				box(v, cx + 0.14, cy - 0.14, 0.06, 0.06, 6, 29.5, '#2b2b2b');
			}
			break;
		}
		case 'mairie':
			shadow(v, cx, cy, 0.5);
			box(v, cx, cy + 0.38, 0.2, 0.05, 2, 0, '#cbb894');
			box(v, cx, cy, 0.42, 0.34, 20, 0, '#efe2c4');
			face(v, cx, cy, 0.42, 0.34, 'L', 0.43, 0.57, 0, 11, '#7a4a2a');
			windows(v, cx, cy, 0.42, 0.34, 'L', 5, 7, 14, '#4b5d6b', 2);
			windows(v, cx, cy, 0.42, 0.34, 'R', 3, 7, 14, '#4b5d6b');
			box(v, cx, cy, 0.44, 0.36, 2.5, 20, '#c2452d');
			box(v, cx, cy, 0.17, 0.17, 10, 22.5, '#efe2c4');
			face(v, cx, cy, 0.17, 0.17, 'L', 0.3, 0.7, 25, 29, '#4b5d6b');
			flag(v, cx, cy, 32.5);
			break;
		case 'marche':
			shadow(v, cx, cy, 0.45);
			([[-0.2, -0.2, '#e8a33d'], [0.2, -0.2, '#2f7d8c'], [-0.2, 0.2, '#c2452d'], [0.2, 0.2, '#6a9b3c']] as [number, number, string][]).forEach(([a, b, k]) => {
				box(v, cx + a, cy + b, 0.12, 0.08, 4, 0, '#8a5a37');
				const p = P(v, cx + a, cy + b);
				['#e04a2a', '#f2b632', '#6aa84f'].forEach((f, j) => { c.fillStyle = f; c.beginPath(); c.arc(p[0] + (j - 1) * 3 * z, p[1] - 5 * z, 1.4 * z, 0, 7); c.fill(); });
				box(v, cx + a - 0.1, cy + b - 0.1, 0.012, 0.012, 9, 0, '#5a4030');
				box(v, cx + a, cy + b, 0.17, 0.17, 1.5, 9, k);
			});
			break;
		case 'forage':
			shadow(v, cx, cy, 0.3);
			[[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]].forEach(([a, b]) => box(v, cx + a - 0.05, cy + b - 0.05, 0.015, 0.015, 20, 0, '#6b6f73'));
			box(v, cx - 0.05, cy - 0.05, 0.16, 0.16, 11, 20, '#3d7fc4');
			box(v, cx - 0.05, cy - 0.05, 0.17, 0.17, 1.5, 31, '#2c5f96');
			box(v, cx + 0.22, cy + 0.18, 0.08, 0.05, 6, 0, '#4a5560');
			break;
		case 'borne': {
			shadow(v, cx, cy, 0.25);
			box(v, cx - 0.05, cy - 0.05, 0.16, 0.05, 7, 0, '#8fa3ad');
			box(v, cx - 0.05, cy + 0.02, 0.02, 0.04, 2, 5, '#5a6870');
			([[-0.15, 0.22, '#c2452d'], [0.05, 0.25, '#f2b632'], [0.22, 0.12, '#3d7fc4']] as [number, number, string][]).forEach(([a, b, k]) => box(v, cx + a, cy + b, 0.05, 0.05, 4, 0, k));
			break;
		}
		case 'ecole':
			shadow(v, cx, cy, 0.48);
			box(v, cx, cy - 0.06, 0.42, 0.22, 13, 0, '#e6c25a');
			windows(v, cx, cy - 0.06, 0.42, 0.22, 'L', 6, 4, 10, '#3d6db3', 3);
			face(v, cx, cy - 0.06, 0.42, 0.22, 'L', 0.52, 0.64, 0, 9, '#6b4a2b');
			windows(v, cx, cy - 0.06, 0.42, 0.22, 'R', 2, 4, 10, '#3d6db3');
			box(v, cx, cy - 0.06, 0.45, 0.25, 2.5, 13, '#8a5a37');
			flag(v, cx - 0.36, cy + 0.36, 0);
			break;
		case 'cscom':
			shadow(v, cx, cy, 0.42);
			box(v, cx, cy, 0.34, 0.34, 15, 0, '#f3f0e8');
			face(v, cx, cy, 0.34, 0.34, 'L', 0.4, 0.6, 0, 10, '#2f8a57');
			windows(v, cx, cy, 0.34, 0.34, 'L', 4, 6, 11, '#4b6b5b', 1);
			windows(v, cx, cy, 0.34, 0.34, 'R', 3, 6, 11, '#4b6b5b');
			face(v, cx, cy, 0.34, 0.34, 'L', 0, 1, 13, 15, '#2f8a57');
			face(v, cx, cy, 0.34, 0.34, 'R', 0, 1, 13, 15, '#2f8a57');
			box(v, cx, cy, 0.17, 0.045, 1.5, 15, '#2f8a57');
			box(v, cx, cy, 0.045, 0.17, 1.5, 15, '#2f8a57');
			break;
		case 'lampe': {
			box(v, cx, cy, 0.02, 0.02, 26, 0, '#59606a');
			box(v, cx, cy, 0.1, 0.06, 1.5, 26, '#1f3b66', '#2a5aa0');
			const p = P(v, cx, cy), g = 0.35 + 0.1 * Math.sin(time / 500 + x);
			c.fillStyle = `rgba(255,214,110,${g})`; c.beginPath(); c.arc(p[0], p[1] - 23 * z, 4.5 * z, 0, 7); c.fill();
			break;
		}
		case 'depot': {
			shadow(v, cx, cy, 0.45);
			box(v, cx, cy, 0.4, 0.4, 4, 0, '#8b8b84');
			const p = P(v, cx, cy);
			c.fillStyle = '#6f6352'; c.beginPath(); c.ellipse(p[0], p[1] - 4 * z, 14 * z, 9 * z, 0, Math.PI, 0); c.fill();
			['#e04a3a', '#3a8fe0', '#f2f2f2', '#1d1d1d', '#f2b632'].forEach((k, j) => { c.fillStyle = k; c.fillRect(p[0] + (j * 6 - 12) * z, p[1] - (7 + (j % 2) * 4) * z, 2.5 * z, 2.5 * z); });
			break;
		}
		case 'foot':
			box(v, cx - 0.36, cy, 0.01, 0.09, 5, 0, '#ffffff');
			box(v, cx + 0.36, cy, 0.01, 0.09, 5, 0, '#ffffff');
			break;
		case 'arbre':
			tree(v, cx + (hash(x, y) - 0.5) * 0.2, cy + (hash(y, x) - 0.5) * 0.2, vv);
			break;
		case 'lot':
			box(v, cx, cy, 0.02, 0.02, 9, 0, '#6b4a2b');
			if (warn) {
				const p = P(v, cx, cy);
				c.fillStyle = '#c2452d'; c.beginPath(); c.arc(p[0], p[1] - 18 * z, 6 * z, 0, 7); c.fill();
				c.fillStyle = '#fff'; c.font = `800 ${9 * z}px Nunito, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
				c.fillText('!', p[0], p[1] - 17.5 * z);
			}
			break;
	}
}

export function ghost(v: View, x: number, y: number, key: BKey, ok: boolean) {
	const c = v.ctx, d = B[key];
	if (d.r) {
		const r = d.r;
		poly(c, [P(v, x - r, y - r), P(v, x + 1 + r, y - r), P(v, x + 1 + r, y + 1 + r), P(v, x - r, y + 1 + r)], ok ? 'rgba(232,163,61,.18)' : 'rgba(194,69,45,.18)');
		c.strokeStyle = ok ? '#e8a33d' : '#c2452d'; c.lineWidth = 2; c.setLineDash([6, 5]); c.stroke(); c.setLineDash([]);
	}
	c.save(); c.globalAlpha = 0.72;
	sprite(v, x, y, { b: key, lvl: 0, v: 1 });
	c.restore();
}

export function highlight(v: View, x: number, y: number, col = '#e8a33d') {
	const d = dia(v, x + 0.5, y + 0.5, 0.5);
	poly(v.ctx, d, 'rgba(232,163,61,.25)');
	v.ctx.strokeStyle = col; v.ctx.lineWidth = 2; v.ctx.stroke();
}

// ---------- Habitants ----------
export type PKind = 'vendeuse' | 'porteuse' | 'moto' | 'eleve' | 'doyen' | 'jeune' | 'agent' | 'sotrama';
export interface Look { skin: string; a: string; b: string; c: string }
export interface PDraw { kind: PKind; look: Look; phase: number; moving: boolean; dir: number; axis: 'x' | 'y'; carry?: boolean }

export function person(v: View, x: number, y: number, p: PDraw) {
	if (p.kind === 'moto') return moto(v, x, y, p);
	if (p.kind === 'sotrama') return sotrama(v, x, y, p);
	const c = v.ctx, F = P(v, x, y), k = p.kind === 'eleve' ? 0.78 : 1, s = v.z * 1.1 * k, L = p.look;
	const sw = p.moving ? Math.sin(p.phase) * 1.8 * s : 0, bob = p.moving ? Math.abs(Math.sin(p.phase)) * 0.6 * s : 0;
	const fx = F[0], fy = F[1] - bob;
	c.fillStyle = 'rgba(40,20,5,.25)'; c.beginPath(); c.ellipse(F[0], F[1], 4 * s, 1.8 * s, 0, 0, 7); c.fill();
	const long = p.kind === 'vendeuse' || p.kind === 'porteuse' || p.kind === 'doyen';
	c.lineCap = 'round';
	// jambes
	c.strokeStyle = long ? L.skin : p.kind === 'jeune' ? L.skin : '#2b2a33'; c.lineWidth = 1.7 * s;
	c.beginPath(); c.moveTo(fx - 1 * s, fy - 6 * s); c.lineTo(fx - 1 * s + sw, fy);
	c.moveTo(fx + 1 * s, fy - 6 * s); c.lineTo(fx + 1 * s - sw, fy); c.stroke();
	// corps
	if (long) {
		c.fillStyle = L.a;
		c.beginPath(); c.moveTo(fx - 3 * s, fy - 13.5 * s); c.lineTo(fx + 3 * s, fy - 13.5 * s);
		c.lineTo(fx + (p.kind === 'doyen' ? 4.6 : 3.8) * s, fy - 1.2 * s); c.lineTo(fx - (p.kind === 'doyen' ? 4.6 : 3.8) * s, fy - 1.2 * s); c.closePath(); c.fill();
		if (p.kind !== 'doyen') { c.fillStyle = L.b; c.fillRect(fx - 3.6 * s, fy - 6 * s, 7.2 * s, 1.4 * s); c.fillRect(fx - 3.3 * s, fy - 9.5 * s, 6.6 * s, 1 * s); }
		else { c.strokeStyle = L.b; c.lineWidth = 0.8 * s; c.beginPath(); c.moveTo(fx, fy - 13 * s); c.lineTo(fx, fy - 9 * s); c.stroke(); }
	} else {
		c.fillStyle = p.kind === 'eleve' ? '#1f3b66' : p.kind === 'jeune' ? '#f2f2f2' : '#2b2a33';
		c.fillRect(fx - 2.6 * s, fy - 7.5 * s, 5.2 * s, 2.4 * s);
		c.fillStyle = L.a; c.beginPath();
		c.moveTo(fx - 3 * s, fy - 13.5 * s); c.lineTo(fx + 3 * s, fy - 13.5 * s); c.lineTo(fx + 2.7 * s, fy - 6.5 * s); c.lineTo(fx - 2.7 * s, fy - 6.5 * s); c.closePath(); c.fill();
		if (p.kind === 'jeune') { c.fillStyle = L.b; c.fillRect(fx - 3 * s, fy - 13.5 * s, 6 * s, 1.2 * s); }
	}
	// bras
	c.strokeStyle = L.skin; c.lineWidth = 1.3 * s;
	c.beginPath(); c.moveTo(fx - 3 * s, fy - 12.5 * s); c.lineTo(fx - 3.6 * s - sw * 0.5, fy - 8 * s);
	c.moveTo(fx + 3 * s, fy - 12.5 * s); c.lineTo(fx + 3.6 * s + sw * 0.5, fy - 8 * s); c.stroke();
	// accessoires
	if (p.kind === 'eleve') { c.fillStyle = L.b; c.fillRect(fx - (p.dir > 0 ? 4.6 : -1.6) * s, fy - 13 * s, 3 * s, 4.5 * s); }
	if (p.kind === 'porteuse' && p.carry !== false) { c.fillStyle = '#f2c230'; c.fillRect(fx + 3.4 * s, fy - 9 * s, 3 * s, 4.2 * s); c.fillStyle = '#c99a1a'; c.fillRect(fx + 4.2 * s, fy - 10 * s, 1.2 * s, 1 * s); }
	if (p.kind === 'doyen') { c.strokeStyle = '#6b4a2b'; c.lineWidth = 0.9 * s; c.beginPath(); c.moveTo(fx + 4.2 * s, fy - 9 * s); c.lineTo(fx + 5.2 * s, fy); c.stroke(); }
	if (p.kind === 'agent') { c.fillStyle = '#5a3d26'; c.fillRect(fx + 3 * s, fy - 8.5 * s, 3 * s, 2.4 * s); }
	// tête
	c.fillStyle = L.skin; c.beginPath(); c.arc(fx, fy - 15.6 * s, 2.5 * s, 0, 7); c.fill();
	if (p.kind === 'vendeuse' || p.kind === 'porteuse') {
		c.fillStyle = L.c; c.beginPath(); c.ellipse(fx, fy - 17 * s, 3 * s, 1.9 * s, 0, 0, 7); c.fill();
		c.beginPath(); c.arc(fx + 2.4 * s * (p.dir || 1), fy - 17.8 * s, 1 * s, 0, 7); c.fill();
	}
	if (p.kind === 'vendeuse' && p.carry !== false) {
		c.fillStyle = '#c9ccd1'; c.beginPath(); c.ellipse(fx, fy - 19 * s, 5 * s, 1.8 * s, 0, 0, 7); c.fill();
		['#e04a2a', '#f2b632', '#e8732a'].forEach((f, j) => { c.fillStyle = f; c.beginPath(); c.arc(fx + (j - 1) * 2.2 * s, fy - 20.2 * s, 1.2 * s, 0, 7); c.fill(); });
	}
	if (p.kind === 'doyen') { c.fillStyle = L.c; c.fillRect(fx - 2.4 * s, fy - 18.6 * s, 4.8 * s, 1.8 * s); }
	if (p.kind === 'agent' || p.kind === 'eleve') { /* tête nue */ }
	if (p.kind === 'jeune' && L.c !== 'none') { c.fillStyle = L.c; c.beginPath(); c.ellipse(fx, fy - 17.4 * s, 2.7 * s, 1.3 * s, 0, Math.PI, 0); c.fill(); c.fillRect(fx + (p.dir > 0 ? 1 : -4) * s, fy - 17.6 * s, 3 * s, 0.9 * s); }
}
function moto(v: View, x: number, y: number, p: PDraw) {
	const c = v.ctx, F = P(v, x, y), s = v.z, L = p.look;
	// direction écran : sur l'axe x la moto va vers le bas-droite, sur l'axe y vers le bas-gauche
	const sx = (p.axis === 'x' ? 1 : -1) * p.dir;
	c.fillStyle = 'rgba(40,20,5,.25)'; c.beginPath(); c.ellipse(F[0], F[1], 7 * s, 2.6 * s, 0, 0, 7); c.fill();
	const wx = 5 * s, wy = 2.4 * s * (p.dir > 0 ? 1 : -1);
	c.fillStyle = '#1d1d1d';
	c.beginPath(); c.arc(F[0] - wx * sx, F[1] - 2 * s - wy * 0.6, 2.1 * s, 0, 7); c.arc(F[0] + wx * sx, F[1] - 2 * s + wy * 0.6, 2.1 * s, 0, 7); c.fill();
	c.fillStyle = L.b; c.beginPath();
	c.moveTo(F[0] - 5 * s * sx, F[1] - 4 * s); c.lineTo(F[0] + 4 * s * sx, F[1] - 3 * s); c.lineTo(F[0] + 4.5 * s * sx, F[1] - 6.5 * s); c.lineTo(F[0] - 3 * s * sx, F[1] - 7 * s); c.closePath(); c.fill();
	// pilote
	c.fillStyle = L.a; c.fillRect(F[0] - 2.4 * s, F[1] - 14 * s, 4.8 * s, 7 * s);
	c.strokeStyle = L.skin; c.lineWidth = 1.3 * s; c.beginPath(); c.moveTo(F[0] + 1 * s * sx, F[1] - 12 * s); c.lineTo(F[0] + 4.5 * s * sx, F[1] - 8 * s); c.stroke();
	c.fillStyle = L.skin; c.beginPath(); c.arc(F[0], F[1] - 16 * s, 2.4 * s, 0, 7); c.fill();
	c.fillStyle = L.c; c.beginPath(); c.ellipse(F[0], F[1] - 17.2 * s, 2.6 * s, 1.4 * s, 0, Math.PI, 0); c.fill(); c.fillRect(F[0] + (sx > 0 ? 1 : -4) * s, F[1] - 17.4 * s, 3 * s, 0.9 * s);
}
function sotrama(v: View, x: number, y: number, p: PDraw) {
	const ax = p.axis === 'x';
	const hx = ax ? 0.3 : 0.13, hy = ax ? 0.13 : 0.3;
	shadow(v, x, y, 0.3, 0.25);
	box(v, x, y, hx, hy, 11, 2, '#2e8b3e', '#e9e4d6');
	// bande de vitres
	face(v, x, y, hx, hy, 'L', 0.1, 0.9, 7, 10.5, '#26343a');
	face(v, x, y, hx, hy, 'R', 0.1, 0.9, 7, 10.5, '#26343a');
	face(v, x, y, hx, hy, 'L', 0, 1, 3.5, 5, '#f2c230');
	box(v, x - (ax ? 0.08 : 0), y - (ax ? 0 : 0.08), ax ? 0.12 : 0.08, ax ? 0.08 : 0.12, 3, 13, '#8a5a37');
}

// ---------- Portraits des cartes d'événements ----------
export type Who = 'chef' | 'commercante' | 'jeune' | 'gouverneur' | 'ong' | 'agent' | 'infirmiere' | 'enseignant' | 'diaspora' | 'maire';
const BUST: Record<Who, { bg: string; top: string; head: string | null; skin: string; extra?: string }> = {
	chef: { bg: '#2f7d8c', top: '#9cc3e6', head: '#f4efe2', skin: SKIN[2], extra: 'beard' },
	commercante: { bg: '#e8a33d', top: '#c2452d', head: '#6a9b3c', skin: SKIN[1], extra: 'earring' },
	jeune: { bg: '#6a9b3c', top: '#f2b632', head: null, skin: SKIN[0], extra: 'cap' },
	gouverneur: { bg: '#3d6db3', top: '#2b2a33', head: null, skin: SKIN[3], extra: 'tie' },
	ong: { bg: '#2f8a57', top: '#e9e4d6', head: '#2f7d8c', skin: SKIN[1], extra: 'badge' },
	agent: { bg: '#c2452d', top: '#d9c59a', head: null, skin: SKIN[0] },
	infirmiere: { bg: '#2f7d8c', top: '#f3f0e8', head: '#f3f0e8', skin: SKIN[3], extra: 'cross' },
	enseignant: { bg: '#d9a21b', top: '#3d6db3', head: null, skin: SKIN[2], extra: 'glasses' },
	diaspora: { bg: '#8a3b8f', top: '#2b2a33', head: null, skin: SKIN[1], extra: 'tie' },
	maire: { bg: '#e8a33d', top: '#f4efe2', head: '#f4efe2', skin: SKIN[1], extra: 'sash' }
};
export function bust(c: CanvasRenderingContext2D, who: Who, W: number, H: number) {
	const d = BUST[who], cx = W / 2, r = Math.min(W, H) / 2;
	c.clearRect(0, 0, W, H);
	c.save(); c.beginPath(); c.arc(cx, H / 2, r, 0, 7); c.clip();
	c.fillStyle = d.bg; c.fillRect(0, 0, W, H);
	c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(cx - r * 0.5, H * 0.2, r * 0.7, 0, 7); c.fill();
	// épaules
	c.fillStyle = d.top; c.beginPath(); c.ellipse(cx, H * 1.02, r * 0.85, r * 0.55, 0, Math.PI, 0); c.fill();
	if (d.extra === 'tie') { c.fillStyle = '#f3f0e8'; c.beginPath(); c.moveTo(cx - r * 0.14, H * 0.6); c.lineTo(cx + r * 0.14, H * 0.6); c.lineTo(cx, H * 0.8); c.fill(); c.fillStyle = '#c2452d'; c.fillRect(cx - r * 0.05, H * 0.62, r * 0.1, r * 0.4); }
	if (d.extra === 'badge') { c.fillStyle = '#2f8a57'; c.fillRect(cx + r * 0.25, H * 0.78, r * 0.2, r * 0.13); }
	if (d.extra === 'cross') { c.fillStyle = '#2f8a57'; c.fillRect(cx + r * 0.3, H * 0.78, r * 0.18, r * 0.05); c.fillRect(cx + r * 0.365, H * 0.75, r * 0.05, r * 0.18); }
	if (d.extra === 'sash') { c.strokeStyle = '#14b53a'; c.lineWidth = r * 0.08; c.beginPath(); c.moveTo(cx - r * 0.5, H * 0.66); c.lineTo(cx + r * 0.4, H * 1.0); c.stroke(); c.strokeStyle = '#fcd116'; c.beginPath(); c.moveTo(cx - r * 0.42, H * 0.62); c.lineTo(cx + r * 0.5, H * 0.96); c.stroke(); }
	// cou + tête
	c.fillStyle = d.skin; c.fillRect(cx - r * 0.12, H * 0.48, r * 0.24, r * 0.2);
	c.beginPath(); c.ellipse(cx, H * 0.42, r * 0.3, r * 0.36, 0, 0, 7); c.fill();
	// visage
	c.fillStyle = '#1d140e';
	c.beginPath(); c.arc(cx - r * 0.11, H * 0.41, r * 0.035, 0, 7); c.arc(cx + r * 0.11, H * 0.41, r * 0.035, 0, 7); c.fill();
	c.strokeStyle = '#1d140e'; c.lineWidth = r * 0.03; c.beginPath(); c.arc(cx, H * 0.47, r * 0.1, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
	if (d.extra === 'beard') { c.fillStyle = '#d9d4c7'; c.beginPath(); c.ellipse(cx, H * 0.56, r * 0.18, r * 0.1, 0, 0, Math.PI); c.fill(); }
	if (d.extra === 'glasses') { c.strokeStyle = '#1d140e'; c.lineWidth = r * 0.025; c.beginPath(); c.arc(cx - r * 0.11, H * 0.41, r * 0.08, 0, 7); c.moveTo(cx + r * 0.19, H * 0.41); c.arc(cx + r * 0.11, H * 0.41, r * 0.08, 0, 7); c.stroke(); }
	if (d.extra === 'earring') { c.fillStyle = '#f2c230'; c.beginPath(); c.arc(cx - r * 0.29, H * 0.48, r * 0.04, 0, 7); c.arc(cx + r * 0.29, H * 0.48, r * 0.04, 0, 7); c.fill(); }
	// coiffe
	if (d.head) {
		c.fillStyle = d.head;
		if (who === 'chef' || who === 'maire') { c.fillRect(cx - r * 0.28, H * 0.12, r * 0.56, r * 0.22); }
		else { c.beginPath(); c.ellipse(cx, H * 0.24, r * 0.38, r * 0.2, 0, 0, 7); c.fill(); c.beginPath(); c.arc(cx + r * 0.3, H * 0.2, r * 0.1, 0, 7); c.fill(); }
	} else {
		c.fillStyle = '#1d140e'; c.beginPath(); c.ellipse(cx, H * 0.17 + r * 0.12, r * 0.3, r * 0.16, 0, Math.PI, 0); c.fill();
	}
	if (d.extra === 'cap') { c.fillStyle = '#c2452d'; c.beginPath(); c.ellipse(cx, H * 0.21, r * 0.32, r * 0.16, 0, Math.PI, 0); c.fill(); c.fillRect(cx, H * 0.19, r * 0.42, r * 0.06); }
	c.restore();
}
