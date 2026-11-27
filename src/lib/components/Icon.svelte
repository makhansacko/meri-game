<script lang="ts">
	// Icônes de l'interface (traits simples, 24 × 24).
	let { name, size = 22 }: { name: string; size?: number } = $props();
	const paths: Record<string, string> = {
		coin: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zm0 4v10m-3-7.5c0-1.1 1.3-2 3-2s3 .9 3 2-1.3 1.6-3 2-3 .9-3 2 1.3 2 3 2 3-.9 3-2',
		people: 'M8.5 11a3 3 0 1 0 0-6a3 3 0 0 0 0 6zm7 0a2.5 2.5 0 1 0 0-5M3 20c0-3 2.5-5.5 5.5-5.5S14 17 14 20m2-5.5c2.6.3 5 2.2 5 5.5',
		smile: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM8.5 14c1 1.4 2.2 2 3.5 2s2.5-.6 3.5-2M9 9.5h.01M15 9.5h.01',
		hand: 'M3 12l4-4 4 3 3-3 4 1 3 3-6 6-3-1-3 2-6-6zm8-1l3 3',
		layers: 'M12 3l9 5-9 5-9-5 9-5zm-9 9l9 5 9-5M3 16l9 5 9-5',
		target: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zm0 4a5 5 0 1 0 0 10a5 5 0 1 0 0-10zm0 4a1 1 0 1 0 0 2a1 1 0 0 0 0-2z',
		book: 'M4 5c2.5-1 5-1 8 1 3-2 5.5-2 8-1v14c-2.5-1-5-1-8 1-3-2-5.5-2-8-1V5zm8 1v14',
		menu: 'M4 7h16M4 12h16M4 17h16',
		play: 'M8 5l11 7-11 7V5z',
		pause: 'M8 5v14M16 5v14',
		next: 'M5 12h12m-5-6l6 6-6 6',
		close: 'M6 6l12 12M18 6L6 18',
		rain: 'M7 15a4 4 0 0 1 .5-8A5 5 0 0 1 17 8a3.5 3.5 0 0 1 0 7H7zm1 3l-1 2m5-2l-1 2m5-2l-1 2',
		sun: 'M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8zm0-5v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10l1.4 1.4m0-12.8L17 7M7 17l-1.4 1.4',
		recenter: 'M12 2v4m0 12v4M2 12h4m12 0h4M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8z',
		plus: 'M12 5v14M5 12h14',
		minus: 'M5 12h14',
		check: 'M5 12l5 5 9-10'
	};
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
	<path d={paths[name] ?? ''} fill={name === 'play' ? 'currentColor' : 'none'} />
</svg>
