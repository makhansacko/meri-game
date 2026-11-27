<script lang="ts">
	import { game, ui, bump } from '../game/store.svelte';
	import { stats, finance, dateStr, season, isRain } from '../game/sim';
	import { money } from '../game/config';
	import Icon from './Icon.svelte';

	const d = $derived.by(() => {
		ui.rev;
		const g = game.g;
		if (!g) return null;
		const s = stats(g), f = finance(g, s);
		return { name: g.name, budget: g.budget, conf: g.conf, s, f, date: dateStr(g), season: season(g), rain: isRain(g) };
	});
	const open = () => { ui.sheet = { kind: 'finance' }; bump(); };
</script>

{#if d}
	<header class="hud">
		<button class="row1" onclick={open} aria-label="Détail des finances et du mandat">
			<h1>{d.name}</h1>
			<span class="chip">{d.date}</span>
			<span class="chip" class:rain={d.rain}><Icon name={d.rain ? 'rain' : 'sun'} size={15} />{d.season}</span>
		</button>
		<button class="stats" onclick={open} aria-label="Détail des finances">
			<span class="st"><Icon name="coin" size={17} /><b class="num" class:neg={d.budget < 0}>{money(d.budget)}</b><small>{d.f.net >= 0 ? '+' : ''}{money(d.f.net)}/mois</small></span>
			<span class="st"><Icon name="people" size={17} /><b class="num">{d.s.pop}</b><small>{d.s.pop ? Math.round(d.s.wat * 100) + ' % ont l’eau' : 'habitants'}</small></span>
			<span class="st"><Icon name="smile" size={17} /><b class="num">{Math.round(d.s.sat)} %</b><i class="bar"><i style:width="{d.s.sat}%" class:lo={d.s.sat < 40}></i></i></span>
			<span class="st"><Icon name="hand" size={17} /><b class="num">{Math.round(d.conf)} %</b><i class="bar"><i style:width="{d.conf}%" class:lo={d.conf < 35}></i></i></span>
		</button>
	</header>
{/if}

<style>
	.hud {
		position: fixed; top: calc(var(--sat) + 8px); left: 8px; right: 8px; z-index: 5;
		max-width: 560px; margin: 0 auto;
		background: var(--band); color: var(--cream); border-radius: 18px; padding: 8px 12px 9px;
		box-shadow: 0 8px 24px #0000004d;
		background-image: repeating-linear-gradient(90deg, #ffffff08 0 6px, transparent 6px 18px);
	}
	button { background: none; border: 0; padding: 0; text-align: left; width: 100%; color: inherit; }
	.row1 { display: flex; align-items: center; gap: 6px; }
	h1 { font-size: 19px; line-height: 1.1; margin: 0; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.chip { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 800; padding: 2px 9px; border-radius: 99px; background: #ffffff1f; white-space: nowrap; }
	.chip.rain { background: var(--teal); }
	.stats { display: grid; grid-template-columns: 1.25fr 1fr 1fr 1fr; gap: 6px; margin-top: 6px; }
	.st { display: grid; grid-template-columns: auto 1fr; align-items: center; column-gap: 5px; color: var(--gold); }
	.st b { color: var(--cream); font-size: 17px; line-height: 1.1; white-space: nowrap; }
	.st b.neg { color: #ff9a80; }
	.st small { grid-column: 1 / -1; font-size: 13px; color: #f6ead2b3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.bar { grid-column: 1 / -1; display: block; height: 6px; border-radius: 3px; background: #ffffff26; overflow: hidden; margin-top: 5px; }
	.bar i { display: block; height: 100%; background: var(--gold); transition: width 0.4s; }
	.bar i.lo { background: #ff7a5c; }
	@media (max-width: 380px) { .st small { display: none; } h1 { font-size: 17px; } }
</style>
