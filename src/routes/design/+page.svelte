<script lang="ts">
	import { resolve } from '$app/paths';
	import DesignSheet from '../../lib/components/DesignSheet.svelte';
</script>

<main>
	<a href={resolve('/')}>← Retour au jeu</a>
	<DesignSheet />
</main>

<style>
	:global(body) { overflow: auto; user-select: text; }
	main { max-width: 1000px; margin: 0 auto; padding: calc(var(--sat) + 20px) 16px 40px; }
	a { color: var(--red); font-weight: 800; display: inline-block; margin-bottom: 12px; }
</style>
