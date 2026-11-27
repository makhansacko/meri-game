<script lang="ts">
	// Planche de design vivante : bâtiments, habitations, habitants et portraits, dessinés par le code du jeu.
	import { B, money, type BKey } from '../game/config';
	import { drawTile, drawPerson } from '../game/art';
	import { bust, type Who, type PKind, type Look } from '../game/render';
	import { ROLES } from '../game/people';
	import Art from './Art.svelte';

	const buildings: BKey[] = ['mairie', 'route', 'lot', 'caniveau', 'borne', 'forage', 'marche', 'ecole', 'cscom', 'lampe', 'foot', 'depot', 'arbre'];
	const LOOKS: { kind: PKind; look: Look }[] = [
		{ kind: 'vendeuse', look: { skin: '#6e4528', a: '#e8a33d', b: '#c2452d', c: '#2f7d8c' } },
		{ kind: 'porteuse', look: { skin: '#5c3a22', a: '#8a3b8f', b: '#f2b632', c: '#6a9b3c' } },
		{ kind: 'eleve', look: { skin: '#7a4e2e', a: '#c8b27a', b: '#c2452d', c: 'none' } },
		{ kind: 'doyen', look: { skin: '#4b2e1b', a: '#9cc3e6', b: '#e8d9b0', c: '#f4efe2' } },
		{ kind: 'jeune', look: { skin: '#5c3a22', a: '#f2b632', b: '#2f8a57', c: '#c2452d' } },
		{ kind: 'agent', look: { skin: '#6e4528', a: '#cfe0ef', b: '#2b2a33', c: 'none' } },
		{ kind: 'moto', look: { skin: '#4b2e1b', a: '#3d6db3', b: '#c2452d', c: '#2b2a33' } },
		{ kind: 'sotrama', look: { skin: '#000000', a: '#2e8b3e', b: '#2e8b3e', c: '#2e8b3e' } }
	];
	const BUSTS: [Who, string][] = [
		['maire', 'Le ou la maire'], ['chef', 'Chef de quartier'], ['commercante', 'Présidente des femmes du marché'], ['jeune', 'Porte-parole des jeunes'],
		['gouverneur', 'Gouverneur'], ['ong', 'Représentante d’ONG'], ['agent', 'Agent municipal'], ['infirmiere', 'Infirmière'], ['enseignant', 'Enseignant'], ['diaspora', 'Diaspora']
	];
	const PALETTE: [string, string][] = [
		['#D9A462', 'Sol, latérite claire'], ['#A05B37', 'Routes'], ['#A8683A', 'Banco'], ['#3D8FB8', 'Fleuve'], ['#5B8C3A', 'Végétation'],
		['#2A1D14', 'Bogolan (interface)'], ['#E8A33D', 'Or (accent)'], ['#C2452D', 'Rouge argile (alerte)'], ['#2F7D8C', 'Bleu canard (eau)']
	];
</script>

<div class="ds">
	<h2>Planche de design</h2>
	<p class="lead">Tout est dessiné par le code du jeu : ce que tu vois ici est exactement ce qui s’affiche en partie.</p>

	<h3>Bâtiments</h3>
	<div class="grid">
		{#each buildings as k (k)}
			<figure>
				<Art w={132} h={110} draw={(c, w, h) => drawTile(c, w, h, k, 0, 1)} label={B[k].label} />
				<figcaption><b>{B[k].label}</b><span>{B[k].cost ? money(B[k].cost) : 'unique'}{B[k].r ? ` · rayon ${B[k].r}` : ''}</span></figcaption>
			</figure>
		{/each}
	</div>

	<h3>Habitations : 3 niveaux, 4 variantes</h3>
	{#each [1, 2, 3] as lvl (lvl)}
		<div class="row">
			<b class="rl">{['', 'Case en banco', 'Maison en dur', 'Immeuble R+1'][lvl]}</b>
			{#each [0, 1, 2, 3] as v (v)}<Art w={96} h={92} draw={(c, w, h) => drawTile(c, w, h, 'house', lvl, v)} label="Niveau {lvl}, variante {v + 1}" />{/each}
		</div>
	{/each}

	<h3>Habitants</h3>
	<div class="grid">
		{#each LOOKS as p (p.kind)}
			<figure class="pp">
				<div class="duo">
					<Art w={56} h={76} draw={(c, w, h) => drawPerson(c, w, h, p.kind, p.look, false)} label={ROLES[p.kind]} />
					{#if p.kind !== 'sotrama'}<Art w={56} h={76} draw={(c, w, h) => drawPerson(c, w, h, p.kind, p.look, true, 1.2)} />{/if}
				</div>
				<figcaption><b>{ROLES[p.kind]}</b></figcaption>
			</figure>
		{/each}
	</div>

	<h3>Portraits des événements</h3>
	<div class="grid busts">
		{#each BUSTS as [w, l] (w)}
			<figure><Art w={84} h={84} draw={(c, W, H) => bust(c, w, W, H)} label={l} /><figcaption><b>{l}</b></figcaption></figure>
		{/each}
	</div>

	<h3>Palette</h3>
	<div class="pal">
		{#each PALETTE as [hex, l] (hex)}<div><i style:background={hex}></i><b>{l}</b><span>{hex}</span></div>{/each}
	</div>
</div>

<style>
	.ds h2 { font-size: 28px; margin: 0; line-height: 1.1; }
	.ds h3 { font-size: 19px; margin: 22px 0 8px; }
	.lead { color: var(--muted); margin: 4px 0 0; }
	.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
	figure { margin: 0; background: var(--card2); border-radius: 14px; padding: 8px; display: flex; flex-direction: column; align-items: center; }
	figcaption { text-align: center; font-size: 13px; line-height: 1.25; margin-top: 4px; }
	figcaption b { display: block; font-size: 14px; }
	figcaption span { color: var(--muted); font-weight: 700; }
	.duo { display: flex; gap: 2px; }
	.row { display: flex; align-items: center; gap: 6px; overflow-x: auto; background: var(--card2); border-radius: 14px; padding: 6px 10px; margin-bottom: 8px; }
	.rl { flex: none; width: 92px; font-size: 14px; }
	.busts { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
	.pal { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
	.pal div { display: grid; grid-template-columns: 34px 1fr; column-gap: 8px; align-items: center; font-size: 13px; }
	.pal i { grid-row: span 2; width: 34px; height: 34px; border-radius: 8px; border: 1px solid #0002; }
	.pal span { color: var(--muted); font-family: ui-monospace, monospace; }
</style>
