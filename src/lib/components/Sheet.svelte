<script lang="ts">
	import { game, people, ui, bump, build, cancelPending, setTax } from '../game/store.svelte';
	import { B, LVL, POP, SVC_LIST, TAX, money, type BKey } from '../game/config';
	import { coverage, sat, roadAdj, stats, finance, monthsLeft, type Game } from '../game/sim';
	import { quote } from '../game/people';
	import { drawPerson } from '../game/art';
	import Art from './Art.svelte';
	import Icon from './Icon.svelte';

	const close = () => { ui.sheet = ui.tool === 'voir' ? null : { kind: 'tool' }; ui.sel = -1; if (ui.pending >= 0) cancelPending(); bump(); };

	const view = $derived.by(() => {
		ui.rev;
		const g = game.g as Game | null, s = ui.sheet;
		if (!g || !s || s.kind === 'tool') return null;
		if (s.kind === 'tile') {
			const t = g.map[s.i], c = coverage(g);
			if (t.b === 'house' || t.b === 'lot') {
				const road = roadAdj(g, s.i);
				return {
					kind: 'house' as const, title: LVL[t.lvl], pop: POP[t.lvl], sat: t.b === 'house' ? Math.round(sat(g, s.i, c)) : null, low: t.low, fl: t.fl > 0,
					svc: [['Route', road] as [string, boolean], ...SVC_LIST.map(([k, l]) => [l, !!c[k][s.i]] as [string, boolean]), ...(t.low ? [['Caniveau', !!c.drain[s.i]] as [string, boolean]] : [])],
					hint: t.b === 'lot' ? (road ? 'Une famille va bientôt s’installer.' : 'Aucune route à côté : personne ne viendra s’installer.')
						: t.lvl === 1 ? 'Pour devenir maison en dur : eau potable et satisfaction ≥ 58 %.'
						: t.lvl === 2 ? 'Pour un R+1 : eau, école, santé et satisfaction ≥ 72 %.' : 'Le plus haut niveau. Bravo !'
				};
			}
			if (!t.b) return { kind: 'plain' as const, title: t.t === 'w' ? 'Le fleuve' : t.low ? 'Bas-fond' : 'Terrain libre', text: t.t === 'w' ? 'Pêche et maraîchage sur les berges. On n’y construit pas.' : t.low ? 'Terrain inondable pendant l’hivernage : protège-le avec des caniveaux.' : 'Prêt à construire.' };
			const d = B[t.b as BKey];
			return { kind: 'plain' as const, title: d.label, text: d.desc + (d.maint ? ` Entretien : ${money(d.maint)} / mois.` : '') };
		}
		if (s.kind === 'confirm') {
			const d = B[ui.tool as BKey], free = ui.tool === 'forage' && g.tok > 0;
			return { kind: 'confirm' as const, title: d.label, text: d.desc, cost: free ? 0 : d.cost + (g.map[s.i].b === 'arbre' ? 0.05 : 0), maint: d.maint };
		}
		if (s.kind === 'person') {
			const p = people.list.find((q) => q.id === s.id);
			if (!p) return null;
			return { kind: 'person' as const, p, q: quote(g, p) };
		}
		if (s.kind === 'finance') {
			const st = stats(g), f = finance(g, st);
			return { kind: 'finance' as const, f, tax: g.tax, left: monthsLeft(g), mandat: g.mandat, tok: g.tok };
		}
		return null;
	});
</script>

{#if view}
	<section class="sheet" aria-live="polite">
		<button class="x" onclick={close} aria-label="Fermer"><Icon name="close" size={20} /></button>
		{#if view.kind === 'house'}
			<h3>{view.title}</h3>
			<p>{view.pop} habitants{#if view.sat != null} · satisfaction {view.sat} %{/if}{#if view.low} · bas-fond{/if}{#if view.fl} · <b>inondée</b>{/if}</p>
			<div class="svc">{#each view.svc as [l, ok] (l)}<span class:no={!ok}>{l}</span>{/each}</div>
			<p class="hint">{view.hint}</p>
		{:else if view.kind === 'plain'}
			<h3>{view.title}</h3>
			<p>{view.text}</p>
		{:else if view.kind === 'confirm'}
			<h3>Construire : {view.title}</h3>
			<p>{view.text}</p>
			<p class="hint">{view.maint ? `Entretien ${money(view.maint)} / mois. ` : ''}La zone dorée montre ce qu’il dessert.</p>
			<div class="btns">
				<button class="ghost" onclick={cancelPending}>Annuler</button>
				<button class="go" onclick={() => build(ui.pending)}><Icon name="check" size={18} /> Construire · {view.cost ? money(view.cost) : 'offert'}</button>
			</div>
		{:else if view.kind === 'person'}
			<div class="who">
				<div class="pic"><Art w={52} h={64} draw={(c, w, h) => drawPerson(c, w, h, view.p.kind, view.p.look)} /></div>
				<div>
					<h3>{view.p.kind === 'sotrama' ? 'La sotrama' : view.p.name}</h3>
					<p class="role">{view.p.role}</p>
				</div>
			</div>
			<p class="bubble">« {view.q} »</p>
		{:else if view.kind === 'finance'}
			<h3>Finances du mois</h3>
			<table>
				<tbody>
					<tr><td>Impôts et TDRL <small>(recouvrement {Math.round(view.f.rec * 100)} %)</small></td><td>+{money(view.f.imp)}</td></tr>
					<tr><td>Taxes du marché</td><td>+{money(view.f.mk)}</td></tr>
					<tr><td>Dotation de l’État <small>(en décembre)</small></td><td>+{money(view.f.tr)}</td></tr>
					<tr><td>Entretien des équipements</td><td>−{money(view.f.ent)}</td></tr>
					<tr class="tot"><td>Solde du mois</td><td>{view.f.net >= 0 ? '+' : ''}{money(view.f.net)}</td></tr>
				</tbody>
			</table>
			<p class="lbl">Niveau des impôts</p>
			<div class="seg">
				{#each TAX as t, k (t)}<button class:on={view.tax === k} onclick={() => setTax(k)}>{t}</button>{/each}
			</div>
			<p class="hint">Plus la confiance est haute, mieux les habitants paient. Des impôts élevés rapportent vite mais usent la confiance. Mandat {view.mandat} · élections dans {view.left} mois.</p>
		{/if}
	</section>
{/if}

<style>
	.sheet {
		position: fixed; left: 8px; right: 8px; bottom: calc(var(--dock) + var(--sab) + 8px); z-index: 7; max-width: 460px;
		background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 12px 44px 12px 14px;
		box-shadow: 0 10px 30px #00000052; animation: up 0.18s ease-out; max-height: 55vh; overflow: auto;
	}
	@keyframes up { from { transform: translateY(12px); opacity: 0; } }
	h3 { margin: 0 0 2px; font-size: 19px; line-height: 1.15; }
	p { margin: 0; }
	.x { position: absolute; right: 4px; top: 4px; width: 40px; height: 40px; border: 0; background: none; color: var(--muted); display: grid; place-items: center; }
	.hint { color: var(--muted); font-size: 13px; margin-top: 6px; }
	.svc { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
	.svc span { font-size: 13px; font-weight: 800; padding: 2px 9px; border-radius: 99px; background: #2f8a5726; color: light-dark(#1f6b42, #8fd6a8); }
	.svc span.no { background: #c2452d22; color: var(--red); text-decoration: line-through; }
	.btns { display: flex; gap: 8px; margin-top: 10px; margin-right: -30px; }
	.btns button { flex: 1; min-height: 48px; border-radius: 12px; font-weight: 800; border: 1px solid var(--line); }
	.ghost { background: var(--card2); }
	.go { background: var(--red); color: #fff; border-color: var(--red) !important; display: inline-flex; align-items: center; justify-content: center; gap: 6px; flex: 1.6 !important; }
	.who { display: flex; gap: 10px; align-items: center; }
	.pic { background: var(--card2); border-radius: 12px; }
	.role { color: var(--muted); font-size: 13px; font-weight: 700; }
	.bubble { margin-top: 10px; background: var(--card2); border-radius: 4px 14px 14px 14px; padding: 9px 12px; font-weight: 700; }
	table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 14px; }
	td { padding: 5px 0; border-bottom: 1px solid var(--line); }
	td:last-child { text-align: right; white-space: nowrap; font-weight: 800; }
	td small { color: var(--muted); font-size: 13px; }
	.tot td { border: 0; font-weight: 800; font-size: 16px; }
	.lbl { margin-top: 10px; font-weight: 800; font-size: 13px; }
	.seg { display: flex; gap: 4px; margin-top: 4px; margin-right: -30px; }
	.seg button { flex: 1; min-height: 44px; border-radius: 10px; border: 1px solid var(--line); background: var(--card2); font-weight: 800; text-transform: capitalize; }
	.seg button.on { background: var(--band); color: var(--cream); border-color: var(--band); }
	@media (min-width: 700px) { .sheet { left: 16px; bottom: calc(var(--dock) + var(--sab) + 22px); } }
</style>
