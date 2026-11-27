<script lang="ts">
	import { game, ui, bump, cycleLayer } from '../game/store.svelte';
	import { LAYERS } from '../game/config';
	import Icon from './Icon.svelte';

	let { onRecenter }: { onRecenter: () => void } = $props();
	const layer = $derived.by(() => { ui.rev; return LAYERS[ui.layer][0]; });
	const has = $derived.by(() => { ui.rev; return !!game.g; });
	const open = (kind: 'objectives' | 'journal' | 'menu') => { ui.modal = { kind }; bump(); };
</script>

{#if has}
	<div class="side">
		<button onclick={cycleLayer} aria-label="Calque : {layer}" class:on={ui.layer > 0}><Icon name="layers" /></button>
		{#if ui.layer > 0}<span class="tag">{layer}</span>{/if}
		<button onclick={() => open('objectives')} aria-label="Objectifs du mandat"><Icon name="target" /></button>
		<button onclick={() => open('journal')} aria-label="Journal de la mairie"><Icon name="book" /></button>
		<button onclick={onRecenter} aria-label="Recentrer la carte"><Icon name="recenter" /></button>
		<button onclick={() => open('menu')} aria-label="Menu"><Icon name="menu" /></button>
	</div>
{/if}

<style>
	.side { position: fixed; right: 8px; top: calc(var(--sat) + 108px); z-index: 4; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
	.hidden { display: none; }
	button { width: 46px; height: 46px; border-radius: 50%; border: 1px solid var(--line); background: var(--card); color: var(--ink); display: grid; place-items: center; box-shadow: 0 4px 12px #0003; }
	button.on { background: var(--teal); color: #fff; border-color: var(--teal); }
	.tag { margin-top: -4px; font-size: 13px; font-weight: 800; background: var(--teal); color: #fff; border-radius: 99px; padding: 2px 9px; }
	@media (min-width: 700px) { .side { top: calc(var(--sat) + 116px); } }
</style>
