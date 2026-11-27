<script lang="ts">
	// Petit canvas net (densité d'écran) pour une icône ou un dessin de la planche.
	let { w, h, draw, label = '' }: { w: number; h: number; draw: (c: CanvasRenderingContext2D, w: number, h: number) => void; label?: string } = $props();
	let cv: HTMLCanvasElement;
	$effect(() => {
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		cv.width = w * dpr; cv.height = h * dpr;
		const c = cv.getContext('2d');
		if (!c) return;
		c.setTransform(dpr, 0, 0, dpr, 0, 0);
		c.clearRect(0, 0, w, h);
		draw(c, w, h);
	});
</script>

<canvas bind:this={cv} style:width="{w}px" style:height="{h}px" role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : 'true'}></canvas>

<style>
	canvas { display: block; }
</style>
