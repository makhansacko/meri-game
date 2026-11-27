# Consignes pour les agents (Cursor, Claude…)

Ce dépôt est la source de vérité du jeu Mèri. Lire d'abord `README.md` et `docs/plan-de-developpement.md`.

## Règles

- Langue du jeu et des commentaires : français. Ton familier, mots locaux bienvenus (grin, sotrama, déguerpir).
- Mobile d'abord : tester à 390 × 844. Cibles tactiles ≥ 44 px, texte ≥ 13 px.
- La simulation reste pure : `src/lib/game/sim.ts` et `events.ts` n'importent rien de Svelte ni du DOM.
- L'objet de jeu n'est pas réactif : après toute modification, appeler `bump()` (dans `store.svelte.ts`) pour rafraîchir l'interface. Ne pas mettre `game.g` dans un `$state`.
- Équilibrage : changer les chiffres dans `config.ts`, pas en dur dans les composants.
- Nouveau bâtiment : l'ajouter dans `config.ts` (B, CATS), le dessiner dans `render.ts` (`sprite`), puis vérifier la page `/design`.
- Nouvel événement : l'ajouter dans `events.ts` avec un portrait (`who`) existant dans `render.ts` (`BUST`).
- Pas de dépendance lourde ni d'appel réseau : le jeu doit rester hors ligne et léger.
- Avant de pousser : `npm run check` et `npm run build` sans erreur.
- Toute décision de design prise ailleurs se reporte dans `docs/plan-de-developpement.md`.
