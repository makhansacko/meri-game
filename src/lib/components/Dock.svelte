<script lang="ts">
	import { game, ui, bump, selectTool, nextMonth } from '../game/store.svelte';
	import { B, CATS, DEMOLIR, VOIR, money, type BKey, type Tool } from '../game/config';
	import { drawToolIcon } from '../game/art';
	import Art from './Art.svelte';
	import Icon from './Icon.svelte';

	const st = $derived.by(() => { ui.rev; const g = game.g; return { has: !!g, budget: g?.budget ?? 0, tok: g?.tok ?? 0, tuto: g?.tuto ?? -1 }; });
	const catOf = (t: Tool) => CATS.find((c) => c.tools.includes(t as BKey))?.id ?? null;
	const curCat = $derived(ui.cat);
	const tray = $derived(curCat ? CATS.find((c) => c.id === curCat) : null);
	const showTray = $derived(st.has && (!!tray || ui.tool === 'demolir') && (!ui.sheet || ui.sheet.kind === 'tool'));
	const toolInfo = $derived.by(() => {
		ui.rev;
		const t = ui.tool;
		if (t === 'voir') return VOIR;
		if (t === 'demolir') return DEMOLIR;
		return B[t];
	});

	const toolCost = $derived(ui.tool === 'voir' ? 0 : ui.tool === 'demolir' ? DEMOLIR.cost : B[ui.tool].cost);
	function openCat(id: string) {
		if (ui.cat === id) { ui.cat = null; bump(); return; }
		ui.cat = id; ui.sheet = null;
		if (catOf(ui.tool) !== id) selectTool(CATS.find((c) => c.id === id)!.tools[0]);
		bump();
	}
	function pickTool(t: Tool) { selectTool(t); ui.cat = t === 'voir' || t === 'demolir' ? null : catOf(t); bump(); }
	const iconDraw = (t: Tool) => (c: CanvasRenderingContext2D, w: number, h: number) => drawToolIcon(c, w, h, t);
	const hint = (t: string) => st.tuto === 0 && t === 'routes' || st.tuto === 1 && t === 'routes' || st.tuto === 2 && t === 'services';
</script>

{#if st.has}
	{#if showTray}
		<div class="tray">
			<div class="info">
				<b>{toolInfo.label}</b>
				{#if toolCost}<span class="cost">{ui.tool === 'forage' && st.tok ? 'offert' : money(toolCost)}</span>{/if}
				<p>{toolInfo.desc}{#if ui.tool !== 'voir' && ui.tool !== 'demolir' && B[ui.tool as BKey]?.brush} Glisse le doigt pour tracer.{/if}</p>
			</div>
			{#if tray}
				<div class="tools">
					{#each tray.tools as t (t)}
						<button class="tool" class:on={ui.tool === t} class:poor={B[t].cost > st.budget && !(t === 'forage' && st.tok)} onclick={() => pickTool(t)}>
							<Art w={56} h={40} draw={iconDraw(t)} />
							<b>{B[t].label}</b>
							<small>{t === 'forage' && st.tok ? 'offert' : money(B[t].cost)}</small>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<button class="play" onclick={() => { ui.speed = ui.speed ? 0 : 1; bump(); }} aria-label={ui.speed ? 'Mettre en pause' : 'Faire défiler les mois'} class:on={ui.speed > 0}>
		<Icon name={ui.speed ? 'pause' : 'play'} size={18} />
	</button>

	<nav class="dock">
		<button class="cat" class:on={ui.tool === 'voir'} onclick={() => pickTool('voir')}>
			<Art w={40} h={30} draw={iconDraw('voir')} /><span>Voir</span>
		</button>
		{#each CATS as c (c.id)}
			<button class="cat" class:on={ui.cat === c.id || catOf(ui.tool) === c.id} class:hint={hint(c.id)} onclick={() => openCat(c.id)}>
				<Art w={40} h={30} draw={iconDraw(c.icon)} /><span>{c.label}</span>
			</button>
		{/each}
		<button class="cat" class:on={ui.tool === 'demolir'} onclick={() => pickTool('demolir')}>
			<Art w={40} h={30} draw={iconDraw('demolir')} /><span>Démolir</span>
		</button>
		<button class="next" class:hint={st.tuto === 3} onclick={nextMonth} aria-label="Mois suivant">
			<Icon name="next" size={24} /><span>Mois<br />suivant</span>
		</button>
	</nav>
{/if}

<style>
	.dock {
		position: fixed; left: 0; right: 0; bottom: 0; z-index: 6;
		display: flex; align-items: stretch; gap: 2px;
		padding: 6px 6px calc(6px + var(--sab)); min-height: var(--dock);
		background: var(--card); border-top: 1px solid var(--line); box-shadow: 0 -6px 20px #00000026;
	}
	.cat { flex: 1; border: 0; background: none; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; padding: 3px 0; color: var(--ink); }
	.cat span { font-size: 13px; font-weight: 800; letter-spacing: -0.2px; white-space: nowrap; }
	.cat.on { background: var(--card2); box-shadow: inset 0 0 0 2px var(--gold); }
	.hint { animation: pulse 1.4s ease-in-out infinite; }
	@keyframes pulse { 50% { box-shadow: inset 0 0 0 3px var(--red), 0 0 0 4px #c2452d44; } }
	.next { flex: none; width: 70px; border: 0; border-radius: 16px; background: var(--red); color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0; font: 800 13px/1.05 'Baloo 2', sans-serif; text-align: center; box-shadow: 0 4px 0 #8f2f1d; }
	.next:active { transform: translateY(2px); box-shadow: 0 2px 0 #8f2f1d; }
	.play { position: fixed; right: 12px; bottom: calc(var(--dock) + var(--sab) + 12px); z-index: 6; width: 46px; height: 46px; border-radius: 50%; border: 1px solid var(--line); background: var(--card); color: var(--red); display: grid; place-items: center; box-shadow: 0 4px 12px #0003; }
	.play.on { background: var(--red); color: #fff; border-color: var(--red); }
	.tray {
		position: fixed; left: 8px; right: 66px; bottom: calc(var(--dock) + var(--sab) + 8px); z-index: 6; max-width: 520px;
		background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 8px; box-shadow: 0 8px 24px #0000004d;
	}
	.info { padding: 0 4px 6px; }
	.info b { font: 800 16px 'Baloo 2', sans-serif; }
	.cost { margin-left: 6px; font-size: 13px; font-weight: 800; color: var(--red); }
	.info p { margin: 0; font-size: 13px; color: var(--muted); line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
	.tools { display: flex; gap: 6px; overflow-x: auto; scroll-snap-type: x proximity; padding-bottom: 2px; }
	.tool { flex: none; width: 76px; border: 2px solid transparent; background: var(--card2); border-radius: 12px; padding: 2px 2px 5px; display: flex; flex-direction: column; align-items: center; scroll-snap-align: start; }
	.tool b { font-size: 13px; line-height: 1.05; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; text-align: center; font-weight: 800; }
	.tool small { font-size: 13px; color: var(--muted); font-weight: 700; }
	.tool.on { border-color: var(--gold); background: light-dark(#fff1d6, #3a2b1d); }
	.tool.poor small { color: var(--red); }
	@media (min-width: 700px) { .dock { left: 50%; right: auto; transform: translateX(-50%); bottom: calc(10px + var(--sab)); width: 600px; border-radius: 20px; border: 1px solid var(--line); padding-bottom: 6px; } .tray { left: 50%; transform: translateX(-50%); right: auto; width: 600px; max-width: none; bottom: calc(var(--dock) + var(--sab) + 18px); } .play { right: calc(50% - 300px - 58px); bottom: calc(10px + var(--sab) + 14px); } }
</style>
