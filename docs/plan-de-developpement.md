# Mèri — Plan de développement du jeu

Version de référence dans le dépôt, au 27 novembre 2026. Le document de travail commenté vit ici : https://claude.ai/artifact/BtBkDtAwb2uKoaDQmQLYmK. En cas d'écart, **ce dépôt fait foi** : on reporte ici toute décision prise dans le document de travail.

## 1. Vision

Mèri est un jeu mobile gratuit : le joueur devient maire d'une commune sahélienne et la fait grandir pendant un mandat de 5 ans. Objectif : une version 1.0 sur Android au Mali en environ 9 mois, puis le Burkina Faso, le Niger, le Sénégal et la Guinée. *Mèri* veut dire « mairie » en bambara.

- **Promesse** : « Ta commune, tes choix. » On y reconnaît son quartier : latérite, forage, marché, hivernage, motos Djakarta, sotramas.
- **Public** : les 15-35 ans urbains et périurbains du Sahel francophone, sur Android d'entrée de gamme (2 à 3 Go de RAM). En second : élèves, clubs d'éducation civique, élus et agents en formation.
- **Piliers** : reconnaissable (sans exotisme) ; simple à prendre en main (sessions de 5 à 10 min, d'une main) ; des choix qui coûtent (budget, satisfaction, confiance) ; léger et hors ligne (moins de 40 Mo installé).
- **Ce que Mèri n'est pas** : ni un jeu « pay-to-win », ni un manuel d'éducation civique déguisé.

## 2. Gameplay

Boucle mensuelle : **encaisser** (impôts et TDRL, marché, dotation de l'État, diaspora, partenaires) → **construire** → **réagir** (une carte d'événement environ un mois sur deux) → **avancer** (croissance, confiance, saison). Un mandat dure 60 mois de jeu et se termine par une élection.

| Système | Règle de base (prototype) | Ce que le joueur apprend |
| --- | --- | --- |
| Budget | Recettes − entretien chaque mois ; tutelle sous −5 M | Un équipement coûte aussi à entretenir |
| Confiance | Suit la satisfaction ; fait monter le recouvrement des taxes | Pas de recettes sans confiance |
| Satisfaction | Eau, école, santé, ordures, lumière, loisirs, marché, ombre, route | Ce que les gens attendent concrètement |
| Croissance | Case en banco → maison en dur → R+1, selon seuils et services | Les services font monter le quartier |
| Saisons | Inondations des bas-fonds sans caniveau, juillet à septembre | Le drainage, c'est de la prévention |
| Événements | Cartes à choix, coût et effet affichés | Gouverner, c'est arbitrer |
| Élections | Réélection si confiance ≥ 50 % | La confiance se bâtit sur 5 ans |
| Habitants | Leurs répliques reflètent les besoins non couverts | Écouter sa commune |

Progression prévue : mandat 2 sur une carte de 24 × 24 avec conseil communal et budget annuel (PDSEC simplifié) ; mandat 3 avec intercommunalité et économie locale ; scénarios (commune rurale du delta, ville sur le fleuve, quartier de Bamako).

Questions ouvertes : mode temps réel en plus du tour par tour ? place des autorités traditionnelles dans les décisions ? données réelles pour un mode « ma vraie commune » ?

## 3. Direction artistique

- Isométrie 2D « diorama », volumes simples, couleurs pleines, sans contour noir. Tuile 64 × 32 px. Lumière en haut à gauche : face gauche −16 %, face droite −32 %, toit +8 %.
- Le sol raconte la saison : ocre sec, puis verdissement, flaques et pluie pendant l'hivernage.
- Palette : sol #D9A462 · routes #A05B37 · banco #A8683A · fleuve #3D8FB8 · végétation #5B8C3A · interface #2A1D14 · or #E8A33D · rouge argile #C2452D · bleu canard #2F7D8C.
- Typographie : Baloo 2 (titres, chiffres) et Nunito (texte), embarquées pour le hors-ligne ; le latin étendu couvre ɛ, ɔ, ɲ, ŋ.
- Son : musique originale (balafon, kora, ngoni, calebasse), ambiances enregistrées à Bamako.
- Langues : français au lancement ; bambara (texte et voix) en phase 2 ; puis fulfulde, songhaï, wolof.

## 4. Bâtiments

Source de vérité chiffrée : `src/lib/game/config.ts`. Planche visuelle : page `/design`.

Dans le prototype (3 catégories : Routes, Services, Quartier) : mairie, concessions (3 niveaux × 4 variantes), route, lotissement, caniveau, borne-fontaine, forage, marché, école, CSCom, lampadaire solaire, terrain de foot, dépôt de transit, arbre (néré, manguier, baobab).

Prévus pour la v1.0 : gare routière, maison des jeunes, périmètre maraîcher, mini-centrale solaire, commissariat, lycée, abattoir et marché à bétail. Lieux de culte : à concevoir avec des leaders communautaires.

Règles : une silhouette par fonction, une couleur signature lisible de loin ; 2 à 4 variantes pour l'habitat ; chaque service a des habitants qui le font vivre.

## 5. Personnages

Dessinés en code (`render.ts`), ils varient par tenue et accessoire. Leur nombre suit la population (`people.ts`).

| Personnage | Tenue et accessoire | Présence |
| --- | --- | --- |
| Vendeuse | Pagne wax, foulard, bassine sur la tête | Dès qu'il y a un marché |
| Porteuse d'eau | Robe, foulard, bidon jaune | Dès qu'il y a de l'eau potable |
| Motocycliste | Casquette, moto Djakarta | Dès 60 habitants |
| Écoliers | Uniforme kaki, cartable | Si une école existe |
| Doyen | Grand boubou, bonnet, canne | Toujours |
| Jeunes du grin | Maillot, ballon | Au terrain de foot |
| Agent municipal | Chemise claire, cartable | Toujours |
| Sotrama | Minibus vert | Dès 150 habitants |

Portraits des cartes d'événements : maire, chef de quartier, présidente des femmes du marché, porte-parole des jeunes, gouverneur, représentante d'ONG, agent municipal, infirmière, enseignant, diaspora.

Toucher un habitant affiche son nom (prénoms et noms maliens courants), son rôle et une réplique tirée du besoin non couvert le plus fort de son quartier.

## 6. Expérience mobile

- Carte plein écran, tenue à la verticale, jouée au pouce ; interface dans les zones sûres.
- En haut : commune, date, saison, 4 jauges (toucher = détail des finances). À droite : calques, objectifs, journal, recentrer, menu. En bas : Voir, Routes, Services, Quartier, Démolir et « Mois suivant » ; bouton lecture/pause.
- Gestes : glisser pour déplacer ; glisser pour tracer avec Route, Caniveau, Lotissement, Arbre, Démolir ; deux doigts pour déplacer et zoomer ; aperçu et confirmation à partir de 2 M.
- Accessibilité : cibles ≥ 44 px, texte ≥ 13 px, contrastes forts. Cibles : 30 images/s sur Android 2 Go, démarrage < 3 s.
- Premier lancement : nom de la commune, puis tutoriel en 3 gestes (route, lotissement, eau).

## 7. Architecture

SvelteKit (Svelte 5, TypeScript), adapter-static, PWA hors ligne ; Capacitor ensuite pour le Play Store. Simulation en TypeScript pur (`sim.ts`, `events.ts`) séparée du rendu Canvas 2D (`render.ts`). Passage à PixiJS seulement au-delà de ~200 personnages ou de cartes 32 × 32. Plan B : porter la simulation vers Godot. Voir le README pour la structure.

## 8. Feuille de route

| Phase | Période | Livrables | Feu vert | Budget indicatif |
| --- | --- | --- | --- | --- |
| Prototype | déc. 2026 – jan. 2027 | Jeu jouable hors ligne, 14 bâtiments, 8 habitants, 12 événements, planche de design, tests avec 15 joueurs | La boucle amuse | 1 à 2 M FCFA |
| Tranche verticale | fév. – avr. 2027 | Graphismes finaux, tutoriel, 15 événements, musique, APK de test | Seuils bêta atteints | 8 à 12 M FCFA |
| Bêta et v1.0 Mali | mai – août 2027 | Bambara, mandat 2, 10 nouveaux bâtiments, portraits, 200 testeurs, fiche Play Store | Lancement public | 15 à 22 M FCFA |
| Extension Sahel | à partir de sept. 2027 | Scénarios par pays, langues locales, version classe | — | à définir |

Total jusqu'à la v1.0 : 24 à 36 M FCFA (ordres de grandeur à confirmer par devis).

## 9. Modèle économique et distribution

Gratuit, sans achat qui donne un avantage. Revenus : scénarios sponsorisés (eau, déchets, élections, climat), version « classe » sous licence, subventions et prix, contenu cosmétique payable en mobile money (après 50 000 joueurs), puis investisseurs pour un studio sahélien. Distribution : lien web installable partagé par WhatsApp, puis Google Play. Partenaires à approcher : programmes de décentralisation, ONG de gouvernance et d'éducation civique, opérateurs télécoms (zero-rating), plateformes d'information communale. Une charte éditoriale protège la neutralité politique.

## 10. Tests, indicateurs et risques

Protocole : 6 à 8 joueurs par session, 15 min de jeu sans aide puis 10 min d'entretien.

| Indicateur | Bêta fermée | Lancement |
| --- | --- | --- |
| Tutoriel terminé | 80 % | 85 % |
| Actifs jour 1 / jour 7 | 40 % / 15 % | 45 % / 20 % |
| Durée de session | 6 min | 8 min |
| Premier mandat terminé | 25 % | 30 % |
| Partages par joueur actif | 0,3 | 0,5 |
| Plantages (Android 2 Go) | < 1 % | < 0,5 % |

Risques principaux : jeu perçu comme politique (commune fictive, charte, relecture) ; performances sur téléphones modestes (tests sur appareil, mode éco, plan B) ; trop pédagogique (tests de plaisir d'abord) ; représentations mal perçues (personnages variés, lieux de culte co-conçus) ; financement (démarrage frugal) ; données chères (hors ligne complet, application légère).
