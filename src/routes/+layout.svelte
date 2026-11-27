<script lang="ts">
	// Polices embarquées (jeu hors ligne) : latin + latin étendu, qui couvre les lettres bambara (ɛ, ɔ, ɲ, ŋ).
	import '@fontsource/baloo-2/latin-700.css';
	import '@fontsource/baloo-2/latin-ext-700.css';
	import '@fontsource/baloo-2/latin-800.css';
	import '@fontsource/baloo-2/latin-ext-800.css';
	import '@fontsource/nunito/latin-400.css';
	import '@fontsource/nunito/latin-ext-400.css';
	import '@fontsource/nunito/latin-700.css';
	import '@fontsource/nunito/latin-ext-700.css';
	import '@fontsource/nunito/latin-800.css';
	import '@fontsource/nunito/latin-ext-800.css';
	import '../app.css';
	import { onMount } from 'svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(() => {
		// Hors ligne : on enregistre le service worker seulement là où c'est permis.
		try {
			if ('serviceWorker' in navigator && location.protocol === 'https:' && window.top === window.self) {
				navigator.serviceWorker.register('./service-worker.js').catch(() => {});
			}
		} catch {
			/* contexte sans service worker */
		}
	});
</script>

<svelte:head>
	<title>Mèri — Ma commune</title>
	<meta name="description" content="Deviens maire de ta commune sahélienne : routes, forages, écoles, hivernage et élections." />
	<meta name="theme-color" content="#2a1d14" />
	<link rel="manifest" href="./manifest.webmanifest" />
	<link rel="icon" href="./icon-192.png" />
	<link rel="apple-touch-icon" href="./icon-192.png" />
</svelte:head>

{@render children()}
