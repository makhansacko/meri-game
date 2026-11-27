<script lang="ts">
	import { game, ui, bump, start, choose, nextMandate, newGamePrompt, clearSave } from '../game/store.svelte';
	import { dateStr, objectives } from '../game/sim';
	import { bust } from '../game/render';
	import Art from './Art.svelte';
	import DesignSheet from './DesignSheet.svelte';
	import Icon from './Icon.svelte';
	import { COMMUNES, COMMUNE_ORDER, type CommuneId } from '../game/communes';

	let pick = $state<CommuneId>('segou');
	const m = $derived(ui.modal);
	const close = () => { ui.modal = null; bump(); };
	const info = $derived.by(() => {
		ui.rev;
		const g = game.g;
		return g ? { date: dateStr(g), obj: objectives(g), log: g.log.slice(-25).reverse(), mandat: g.mandat, conf: Math.round(g.conf), over: g.over } : null;
	});
	function onkey(e: KeyboardEvent) {
		if (e.key === 'Escape' && m && (m.kind === 'objectives' || m.kind === 'journal' || m.kind === 'menu' || m.kind === 'design' || m.kind === 'confirmNew')) close();
	}
</script>

<svelte:window onkeydown={onkey} />

{#if m}
	<div class="veil" class:full={m.kind === 'design'} role="dialog" aria-modal="true">
		<div class="card" class:wide={m.kind === 'design'} class:hero={m.kind === 'start'}>
			{#if m.kind === 'start'}
				<div class="top">
					<Art w={80} h={80} draw={(c, w, h) => bust(c, 'maire', w, h)} label="Portrait du maire" />
					<div>
						<p class="kick">I ni ce, Mèri !</p>
						<h2 class="title">Mèri</h2>
						<p class="sub">Choisis ta commune</p>
					</div>
				</div>
				<p>Tu viens d’être élu·e maire pour 5 ans. Chaque commune a son fleuve ou son marigot, ses repères, ses défis.</p>
				<div class="communes" role="radiogroup" aria-label="Communes">
					{#each COMMUNE_ORDER as id (id)}
						{@const c = COMMUNES[id]}
						<button class="commune" class:on={pick === id} role="radio" aria-checked={pick === id} onclick={() => (pick = id)}>
							<span class="cn">{c.nom}<i class="diff d-{c.difficulte}">{c.difficulte}</i></span>
							<span class="cr">{c.region} · {c.profil === 'fictive' ? 'imaginaire' : c.profil}</span>
							<span class="cd">{c.devise}</span>
						</button>
					{/each}
				</div>
				<p class="pickdesc"><b>{COMMUNES[pick].nom} :</b> {COMMUNES[pick].desc}</p>
				<div class="choices"><button class="go" onclick={() => start(pick)}>Prendre mes fonctions à {COMMUNES[pick].nom}</button></div>
				<p class="note">Communes réelles, situations de jeu inventées : aucun élu réel, chiffres simplifiés.</p>
			{:else if m.kind === 'event'}
				<div class="evhead">
					<Art w={76} h={76} draw={(c, w, h) => bust(c, m.ev.who, w, h)} label={m.ev.whoName} />
					<div><p class="kick">{info?.date} · {m.ev.whoName}</p><h2>{m.ev.title}</h2></div>
				</div>
				<p>{m.ev.text}</p>
				<div class="choices">
					{#each m.ev.choices as c, k (k)}
						<button onclick={() => choose(m.ev, k)}>{c.label}<em>{c.effect}</em></button>
					{/each}
				</div>
			{:else if m.kind === 'objectives' && info}
				<p class="kick">Mandat {info.mandat}</p>
				<h2>Objectifs du mandat</h2>
				<ul class="list">
					{#each info.obj as [l, ok, p] (l)}<li class:ok><span class="dot">{#if ok}<Icon name="check" size={16} />{/if}</span>{l}{#if p}<small> · {p}</small>{/if}</li>{/each}
				</ul>
				<div class="choices"><button class="go" onclick={close}>Retour à la commune</button></div>
			{:else if m.kind === 'journal' && info}
				<p class="kick">{info.date}</p>
				<h2>Journal de la mairie</h2>
				<ul class="list">{#each info.log as l, k (k)}<li>{l}</li>{:else}<li>Rien pour l’instant.</li>{/each}</ul>
				<div class="choices"><button class="go" onclick={close}>Fermer</button></div>
			{:else if m.kind === 'election'}
				<p class="kick">{info?.date} · Élections communales</p>
				<h2>{m.win ? 'Réélu·e ! Les habitants te renouvellent leur confiance.' : 'Battu·e aux élections.'}</h2>
				<div class="big"><div><b>{info?.conf} %</b><small>confiance</small></div><div><b>{m.pop}</b><small>habitants</small></div><div><b>{Math.round(m.sat)} %</b><small>satisfaction</small></div></div>
				<p>{m.win ? 'Un nouveau mandat de 5 ans commence. Les attentes sont plus fortes.' : 'Il fallait au moins 50 % de confiance. Retente ta chance avec une nouvelle commune.'}</p>
				<div class="choices"><button class="go" onclick={() => (m.win ? nextMandate() : newGamePrompt())}>{m.win ? 'Commencer le 2e mandat' : 'Nouvelle partie'}</button></div>
			{:else if m.kind === 'end'}
				<p class="kick">{info?.date} · Fin de partie</p>
				<h2>{info?.over === 'tut' ? 'Commune sous tutelle' : 'Délégation spéciale'}</h2>
				<p>{info?.over === 'tut' ? 'Les dettes de la commune sont devenues trop lourdes. La tutelle reprend la gestion du budget.' : 'La confiance s’est effondrée. Le gouvernement dissout le conseil communal et nomme une délégation spéciale.'}</p>
				<div class="choices"><button class="go" onclick={newGamePrompt}>Nouvelle partie</button></div>
			{:else if m.kind === 'menu'}
				<h2>Menu</h2>
				<div class="choices">
					<button onclick={() => { ui.sheet = { kind: 'finance' }; close(); }}>Finances et impôts<em>Recettes, dépenses, niveau des impôts</em></button>
					<button onclick={() => { ui.modal = { kind: 'design' }; bump(); }}>Planche de design<em>Bâtiments, habitants, portraits et palette</em></button>
					<button onclick={() => { if (game.g) { game.g.tuto = 0; bump(); } close(); }}>Revoir le tutoriel<em>Les trois premiers gestes</em></button>
					<button onclick={() => { ui.modal = { kind: 'confirmNew' }; bump(); }}>Nouvelle partie<em>La commune actuelle sera perdue</em></button>
					<button class="go" onclick={close}>Retour au jeu</button>
				</div>
			{:else if m.kind === 'confirmNew'}
				<h2>Recommencer ?</h2>
				<p>La commune actuelle sera perdue.</p>
				<div class="choices"><button class="go" onclick={() => { clearSave(); newGamePrompt(); }}>Oui, nouvelle partie</button><button onclick={close}>Annuler</button></div>
			{:else if m.kind === 'design'}
				<button class="x" onclick={close} aria-label="Fermer"><Icon name="close" /></button>
				<DesignSheet />
			{/if}
		</div>
	</div>
{/if}

<style>
	.veil { position: fixed; inset: 0; z-index: 20; background: #120c0899; display: flex; align-items: flex-end; justify-content: center; padding: calc(var(--sat) + 12px) 8px calc(var(--sab) + 8px); }
	.veil.full { align-items: stretch; }
	.card {
		position: relative; background: var(--card); color: var(--ink); border-radius: 22px; width: 100%; max-width: 460px; padding: 20px 18px 18px;
		max-height: 100%; overflow: auto; box-shadow: 0 24px 60px #0007; border-top: 8px solid var(--gold); animation: rise 0.22s ease-out;
		user-select: text; -webkit-user-select: text;
	}
	.card.wide { max-width: 980px; }
	@keyframes rise { from { transform: translateY(24px); opacity: 0; } }
	@media (min-width: 700px) { .veil { align-items: center; } }
	h2 { font-size: 26px; line-height: 1.08; margin: 2px 0 8px; text-wrap: balance; }
	p { margin: 0 0 8px; }
	.kick { font-weight: 800; font-size: 13px; color: var(--red); margin: 0; }
	.top { display: flex; gap: 14px; align-items: center; margin-bottom: 10px; }
	.title { font-size: 52px; line-height: 0.9; margin: 2px 0 0; color: var(--red); }
	.sub { font: 800 18px 'Baloo 2', sans-serif; margin: 0; }
	.evhead { display: flex; gap: 12px; align-items: center; margin-bottom: 8px; }
	.evhead h2 { margin: 2px 0 0; }
	.choices { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
	.choices button { text-align: left; border: 1px solid var(--line); background: var(--card2); border-radius: 14px; padding: 11px 13px; font-weight: 800; font-size: 15px; min-height: 52px; }
	.choices button em { display: block; font-style: normal; font-size: 13px; color: var(--muted); font-weight: 700; margin-top: 2px; }
	.choices .go { background: var(--red); color: #fff; border: 0; text-align: center; font: 800 18px 'Baloo 2', sans-serif; box-shadow: 0 4px 0 #8f2f1d; }
	.note { font-size: 13px; color: var(--muted); margin-top: 12px; }
	.list { list-style: none; padding: 0; margin: 8px 0; }
	.list li { padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 14px; display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
	.list li.ok { color: light-dark(#1f6b42, #8fd6a8); font-weight: 800; }
	.list small { color: var(--muted); font-weight: 700; }
	.dot { flex: none; width: 20px; height: 20px; border-radius: 50%; border: 2px solid currentColor; display: grid; place-items: center; align-self: center; }
	.big { display: flex; gap: 18px; margin: 10px 0; }
	.big div { display: flex; flex-direction: column; }
	.big b { font: 800 28px 'Baloo 2', sans-serif; }
	.big small { color: var(--muted); font-size: 13px; }
	.communes { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
	.commune { text-align: left; border: 2px solid var(--line); background: var(--card2); border-radius: 14px; padding: 9px 10px; display: flex; flex-direction: column; gap: 2px; min-height: 44px; }
	.commune.on { border-color: var(--red); background: light-dark(#fff1e6, #3a2418); }
	.cn { font: 800 18px/1.1 'Baloo 2', sans-serif; display: flex; justify-content: space-between; align-items: center; gap: 6px; }
	.cr { font-size: 13px; color: var(--muted); font-weight: 700; }
	.cd { font-size: 13px; line-height: 1.3; }
	.diff { font: 800 13px Nunito, sans-serif; font-style: normal; padding: 1px 7px; border-radius: 99px; background: #2f8a5726; color: light-dark(#1f6b42, #8fd6a8); }
	.d-Moyenne { background: #e8a33d33; color: light-dark(#8a5a10, #f2c27a); }
	.d-Difficile { background: #c2452d26; color: var(--red); }
	.pickdesc { margin-top: 10px; font-size: 14px; }
	@media (max-width: 380px) { .communes { grid-template-columns: 1fr; } .cd { display: none; } }
	.x { position: sticky; top: 0; float: right; width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--line); background: var(--card); display: grid; place-items: center; z-index: 2; }
</style>
