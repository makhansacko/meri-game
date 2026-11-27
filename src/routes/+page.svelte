<script lang="ts">
	import { onMount } from 'svelte';
	import GameCanvas from '../lib/components/GameCanvas.svelte';
	import Hud from '../lib/components/Hud.svelte';
	import SideBar from '../lib/components/SideBar.svelte';
	import Dock from '../lib/components/Dock.svelte';
	import Sheet from '../lib/components/Sheet.svelte';
	import Modals from '../lib/components/Modals.svelte';
	import Overlay from '../lib/components/Overlay.svelte';
	import { ui, load, nextMonth, game } from '../lib/game/store.svelte';

	let map: GameCanvas;

	onMount(() => {
		load();
		// Lecture automatique : un mois toutes les 5 secondes, en pause dès qu'une fenêtre s'ouvre.
		const id = setInterval(() => {
			if (ui.speed && !ui.modal && ui.pending < 0 && !document.hidden) nextMonth();
		}, 5000);
		const key = (e: KeyboardEvent) => {
			if (e.key === ' ' && game.g && !ui.modal && (e.target as HTMLElement)?.tagName !== 'INPUT') { e.preventDefault(); nextMonth(); }
		};
		addEventListener('keydown', key);
		return () => { clearInterval(id); removeEventListener('keydown', key); };
	});
</script>

<GameCanvas bind:this={map} />
<Hud />
<SideBar onRecenter={() => map?.fit()} />
<Overlay />
<Sheet />
<Dock />
<Modals />
