<script lang="ts">
	// Bandeau du tutoriel + messages éphémères.
	import { game, ui, bump, skipTuto } from '../game/store.svelte';

	const STEPS = [
		'Ouvre « Routes » et glisse le doigt sur la carte pour tracer une route.',
		'Pose un « Lotissement » à côté d’une route : une famille viendra.',
		'Apporte l’eau : « Services », puis une borne ou un forage près des maisons.',
		'Appuie sur « Mois suivant » pour voir ta commune vivre.',
		'Bravo ! Touche un habitant (outil Voir) pour l’écouter. Il te dira ce qui manque.'
	];
	const tuto = $derived.by(() => { ui.rev; const t = game.g?.tuto ?? -1; return t >= 0 && t <= 4 && !ui.modal ? t : -1; });

	let shown = $state('');
	let timer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		ui.toastN;
		if (!ui.toast) return;
		shown = ui.toast;
		clearTimeout(timer);
		timer = setTimeout(() => (shown = ''), 3000);
	});
	const done = () => { if (game.g) { game.g.tuto = 5; bump(); } };
</script>

{#if tuto >= 0}
	<div class="tuto" role="status">
		<span class="step">{tuto < 3 ? `${tuto + 1}/3` : tuto === 3 ? 'Go' : '★'}</span>
		<p>{STEPS[tuto]}</p>
		<button onclick={tuto === 4 ? done : skipTuto}>{tuto === 4 ? 'OK' : 'Passer'}</button>
	</div>
{/if}

{#if shown}
	<div class="toast" role="status">{shown}</div>
{/if}

<style>
	.tuto {
		position: fixed; z-index: 5; top: calc(var(--sat) + 112px); left: 8px; right: 64px; max-width: 470px;
		display: flex; align-items: center; gap: 10px; background: var(--card); border: 2px solid var(--gold); border-radius: 14px; padding: 8px 8px 8px 10px;
		box-shadow: 0 8px 20px #0003; animation: pop 0.25s ease-out;
	}
	@keyframes pop { from { transform: scale(0.96); opacity: 0; } }
	.step { flex: none; width: 36px; height: 36px; border-radius: 50%; background: var(--gold); color: var(--band); display: grid; place-items: center; font: 800 14px 'Baloo 2', sans-serif; }
	p { margin: 0; flex: 1; font-size: 13.5px; font-weight: 700; line-height: 1.28; }
	button { flex: none; min-height: 40px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--line); background: var(--card2); font-weight: 800; font-size: 13px; }
	.toast {
		position: fixed; z-index: 8; left: 50%; transform: translateX(-50%); bottom: calc(var(--dock) + var(--sab) + 190px);
		background: var(--band); color: var(--cream); padding: 9px 15px; border-radius: 12px; font-weight: 800; font-size: 14px;
		width: max-content; max-width: calc(100% - 32px); text-align: center; box-shadow: 0 6px 18px #0005; pointer-events: none; animation: pop 0.2s ease-out;
	}
	@media (min-width: 700px) { .tuto { top: calc(var(--sat) + 118px); } }
</style>
