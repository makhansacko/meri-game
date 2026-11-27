# Mèri — Ma commune

Jeu mobile où l'on devient maire d'une commune sahélienne. Projet SvelteKit (Svelte 5, TypeScript), export statique, jouable hors ligne (PWA).

Ce dépôt est la source de vérité du projet. Plan complet : [`docs/plan-de-developpement.md`](docs/plan-de-developpement.md). Consignes pour les agents de code : [`AGENTS.md`](AGENTS.md).

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # site statique dans build/
npm run preview    # tester le build
```

Page de la planche de design : `/design`.

Pour héberger le jeu dans un sous-dossier ou une iframe, avec un routage par `#/…` : retirer `src/routes/+layout.ts`, mettre `fallback: 'index.html'` dans `vite.config.ts`, puis lancer `HASH=1 npm run build`.

## Structure

```
src/lib/game/
  config.ts        bâtiments, outils, catégories, constantes d'équilibrage
  sim.ts           carte, couverture des services, satisfaction, finances, tour mensuel
  events.ts        cartes d'événements (personnage, choix, effets)
  people.ts        habitants : foule, déplacements sur les routes, répliques
  render.ts        rendu isométrique Canvas 2D : sol, bâtiments, habitants, portraits
  art.ts           petits dessins pour l'interface (icônes, planche)
  store.svelte.ts  état de l'interface ($state) et actions, sauvegarde locale
src/lib/components/
  GameCanvas       carte, gestes (glisser, pincer, pinceau), boucle de rendu
  Hud              barre du haut : commune, date, saison, 4 jauges
  SideBar          calques, objectifs, journal, recentrer, menu
  Dock             catégories, tiroir d'outils, « Mois suivant », lecture auto
  Sheet            fiches : case, confirmation, habitant, finances
  Modals           accueil, événements, objectifs, journal, élections, menu, planche
  Overlay          tutoriel en 3 étapes, messages
  DesignSheet      planche de design vivante
src/service-worker.ts   cache hors ligne
static/                 manifeste et icônes
```

## Principes

- La simulation (`sim.ts`, `events.ts`) est du TypeScript pur, sans affichage : on peut la tester, l'équilibrer ou la porter vers un autre moteur.
- L'objet de jeu n'est pas réactif. `ui.rev` signale les changements à l'interface, ce qui garde le rendu canvas rapide sur les téléphones modestes.
- Les coûts sont en millions de FCFA. Ce sont des chiffres de jeu, pas des données réelles.

## Prochaines étapes (voir `docs/plan-de-developpement.md`)

- Emballer avec Capacitor pour l'APK Android.
- Passer les textes dans des fichiers de traduction (français, bambara).
- Sortir l'équilibrage et les événements dans des fichiers JSON.
