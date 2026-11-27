<script lang="ts">
	// La carte : rendu à chaque image, déplacement / zoom au doigt, pinceau pour les routes.
	import { onMount } from 'svelte';
	import { N, TW, TH, B, LAYERS, clamp, type BKey } from '../game/config';
	import { coverage, newGame, isRain, isStorm, roadAdj, type Game } from '../game/sim';
	import { COMMUNES } from '../game/communes';
	import { ground, sprite, ghost, highlight, person, P, type View } from '../game/render';
	import { game, people, ui, applyAt, bump } from '../game/store.svelte';
	import type { Person } from '../game/people';

	let cv: HTMLCanvasElement;
	let W = 0, H = 0, dpr = 1;
	const cam = { x: 0, y: 0, z: 1 };
	let fitted = false;
	const demo: Game = newGame('segou');
	const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	export function fit() {
		const zFit = Math.min(W / (N * TW), H / (N * TH + 80));
		cam.z = clamp(Math.max(zFit, Math.min(W / (8 * TW), 1.1)), 0.35, 2.4);
		cam.x = -((7.5 - 7) * TW / 2) * cam.z;
		cam.y = -((7.5 + 7) * TH / 2 - (N * TH) / 2) * cam.z + 10;
		fitted = true;
	}
	export function zoom(f: number) { zoomAt(W / 2, H / 2, cam.z * f); }
	function clampCam() {
		const mx = (N * TW) / 2 * cam.z, my = (N * TH) / 2 * cam.z;
		cam.x = clamp(cam.x, -mx, mx); cam.y = clamp(cam.y, -my, my);
	}
	function zoomAt(mx: number, my: number, nz: number) {
		nz = clamp(nz, 0.35, 3);
		const wx = (mx - W / 2 - cam.x) / cam.z, wy = (my - H / 2 - cam.y) / cam.z;
		cam.x = mx - W / 2 - wx * nz; cam.y = my - H / 2 - wy * nz; cam.z = nz; clampCam();
	}
	const view = (): View => ({ ctx: cv.getContext('2d')!, z: cam.z, ox: W / 2 + cam.x, oy: H / 2 + cam.y - (N * TH) / 2 * cam.z });
	function pick(px: number, py: number): number {
		const ix = (px - W / 2 - cam.x) / cam.z, iy = (py - H / 2 - cam.y) / cam.z + (N * TH) / 2;
		const a = ix / (TW / 2), b = iy / (TH / 2);
		const x = Math.floor((a + b) / 2), y = Math.floor((b - a) / 2);
		return x >= 0 && y >= 0 && x < N && y < N ? y * N + x : -1;
	}
	function pickPerson(px: number, py: number): Person | null {
		const v = view();
		let best: Person | null = null, bd = Math.max(16, 11 * cam.z);
		for (const p of people.list) {
			const s = P(v, p.x, p.y), d = Math.hypot(px - s[0], py - (s[1] - 9 * cam.z));
			if (d < bd) { bd = d; best = p; }
		}
		return best;
	}

	// ---------- Rendu ----------
	function draw(g: Game, t: number) {
		const v = view(), c = v.ctx;
		const cov = coverage(g), layer = LAYERS[ui.layer][1];
		const roads = (i: number) => {
			const x = i % N, y = (i / N) | 0, r: [number, number][] = [];
			for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) {
				const X = x + a, Y = y + b;
				if (X >= 0 && Y >= 0 && X < N && Y < N && g.map[Y * N + X].b === 'route') r.push([a, b]);
			}
			return r;
		};
		const opt = { vert: COMMUNES[g.commune]?.vert ?? 0, rain: isRain(g), time: reduce ? null : t, layer, cov: cov as unknown as Record<string, Uint8Array>, roads };
		for (let i = 0; i < N * N; i++) ground(v, i % N, (i / N) | 0, g.map[i], i, opt);
		if (ui.sel >= 0 && ui.pending < 0 && g === game.g) highlight(v, ui.sel % N, (ui.sel / N) | 0);
		const buckets = new Map<number, Person[]>();
		for (const p of people.list) {
			const d = Math.floor(p.x) + Math.floor(p.y);
			(buckets.get(d) ?? buckets.set(d, []).get(d)!).push(p);
		}
		const balls = people.balls;
		for (let d = 0; d < 2 * N - 1; d++) {
			for (let x = Math.max(0, d - N + 1); x <= Math.min(d, N - 1); x++) {
				const y = d - x, i = y * N + x, tile = g.map[i];
				if (tile.b && i !== ui.pending) sprite(v, x, y, tile, tile.b === 'lot' && !roadAdj(g, i), t);
			}
			const ps = buckets.get(d);
			if (ps) { ps.sort((a, b) => a.x + a.y - (b.x + b.y)); for (const p of ps) person(v, p.x, p.y, p); }
			for (const b of balls) if (Math.floor(b.x) + Math.floor(b.y) === d) {
				const s = P(v, b.x, b.y);
				c.fillStyle = 'rgba(40,20,5,.25)'; c.beginPath(); c.ellipse(s[0], s[1], 2.2 * cam.z, 1 * cam.z, 0, 0, 7); c.fill();
				c.fillStyle = '#fff'; c.beginPath(); c.arc(s[0], s[1] - (2 + b.h) * cam.z, 1.9 * cam.z, 0, 7); c.fill();
			}
		}
		if (ui.pending >= 0 && g === game.g) ghost(v, ui.pending % N, (ui.pending / N) | 0, ui.tool as BKey, true);
		if (isStorm(g) && !reduce) {
			c.strokeStyle = 'rgba(170,205,235,.5)'; c.lineWidth = 1; c.beginPath();
			for (let k = 0; k < 90; k++) {
				const rx = ((k * 97.3) % W + t * 0.05) % W, ry = ((k * 53.7) % H + t * 0.6) % H;
				c.moveTo(rx, ry); c.lineTo(rx - 3, ry + 11);
			}
			c.stroke();
		}
	}

	let last = 0;
	function frame(t: number) {
		const dt = Math.min(0.05, (t - (last || t)) / 1000);
		last = t;
		const w = cv.clientWidth, h = cv.clientHeight;
		if (w !== W || h !== H) {
			W = w; H = h; dpr = Math.min(2, window.devicePixelRatio || 1);
			cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
			if (!fitted && W > 0) fit();
		}
		const c = cv.getContext('2d')!;
		c.setTransform(dpr, 0, 0, dpr, 0, 0);
		c.clearRect(0, 0, W, H);
		const g = game.g ?? demo;
		people.update(g, document.hidden ? 0 : dt, t);
		draw(g, t);
		raf = requestAnimationFrame(frame);
	}
	let raf = 0;
	let usedDemo = true;
	$effect(() => {
		// au démarrage d'une vraie partie, la foule de la démo est remplacée
		ui.rev;
		if (game.g && usedDemo) { usedDemo = false; people.reset(); fit(); }
		if (!game.g) usedDemo = true;
	});

	// ---------- Gestes ----------
	const ptrs = new Map<number, { x: number; y: number }>();
	let drag: { x: number; y: number; cx: number; cy: number; moved: boolean; paint: boolean; lastI: number } | null = null;
	let pinch: { d: number; z: number; mx: number; my: number; cx: number; cy: number } | null = null;
	const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
	const isBrush = () => ui.tool === 'demolir' || (ui.tool !== 'voir' && !!B[ui.tool as BKey]?.brush);

	function down(e: PointerEvent) {
		if (!game.g) return;
		cv.setPointerCapture(e.pointerId);
		ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
		if (ptrs.size === 1) {
			const paint = isBrush() && e.button === 0 && !ui.modal;
			drag = { x: e.offsetX, y: e.offsetY, cx: cam.x, cy: cam.y, moved: false, paint, lastI: -1 };
			if (e.button === 1 || e.button === 2) drag.paint = false;
		} else if (ptrs.size === 2) {
			const [a, b] = [...ptrs.values()];
			pinch = { d: dist(a, b) || 1, z: cam.z, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, cx: cam.x, cy: cam.y };
			drag = null;
		}
	}
	function move(e: PointerEvent) {
		if (!ptrs.has(e.pointerId)) return;
		ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
		if (ptrs.size === 2 && pinch) {
			const [a, b] = [...ptrs.values()];
			const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
			cam.x = pinch.cx + (mx - pinch.mx); cam.y = pinch.cy + (my - pinch.my);
			zoomAt(mx, my, pinch.z * dist(a, b) / pinch.d);
			pinch.z = cam.z; pinch.d = dist(a, b); pinch.mx = mx; pinch.my = my; pinch.cx = cam.x; pinch.cy = cam.y;
		} else if (drag) {
			const dx = e.offsetX - drag.x, dy = e.offsetY - drag.y;
			if (Math.abs(dx) + Math.abs(dy) > 8) drag.moved = true;
			if (drag.paint) {
				const i = pick(e.offsetX, e.offsetY);
				if (drag.moved && i >= 0 && i !== drag.lastI) { drag.lastI = i; applyAt(i, true); }
			} else if (drag.moved) { cam.x = drag.cx + dx; cam.y = drag.cy + dy; clampCam(); }
		}
	}
	function up(e: PointerEvent) {
		if (!ptrs.has(e.pointerId)) return;
		ptrs.delete(e.pointerId);
		if (ptrs.size < 2) pinch = null;
		if (ptrs.size === 1) { drag = null; return; }
		if (ptrs.size === 0 && drag) {
			if (!drag.moved) {
				const px = e.offsetX, py = e.offsetY;
				const p = ui.tool === 'voir' ? pickPerson(px, py) : null;
				if (p) { ui.sheet = { kind: 'person', id: p.id }; ui.sel = -1; bump(); }
				else { const i = pick(px, py); if (i >= 0) applyAt(i, false); }
			}
			drag = null;
		}
	}
	function cancel(e: PointerEvent) { ptrs.delete(e.pointerId); drag = null; pinch = null; }
	function wheel(e: WheelEvent) {
		e.preventDefault();
		const mouseWheel = e.deltaMode === 1 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 50);
		if (e.ctrlKey || mouseWheel) zoomAt(e.offsetX, e.offsetY, cam.z * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
		else { cam.x -= e.deltaX; cam.y -= e.deltaY; clampCam(); }
	}

	onMount(() => {
		raf = requestAnimationFrame(frame);
		cv.addEventListener('wheel', wheel, { passive: false });
		return () => { cancelAnimationFrame(raf); cv.removeEventListener('wheel', wheel); };
	});
</script>

<canvas
	bind:this={cv}
	onpointerdown={down}
	onpointermove={move}
	onpointerup={up}
	onpointercancel={cancel}
	oncontextmenu={(e) => e.preventDefault()}
	aria-label="Carte de la commune"
></canvas>

<style>
	canvas { position: fixed; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; cursor: grab; }
</style>
