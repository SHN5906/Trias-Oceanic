# TRIAS OCEANIC — SITE VITRINE

Site produit d'un acteur du **forage / mine / géotechnique**. Malgré le nom « Oceanic », l'identité est **terrestre : forage, mine, géo — jamais la mer**. Logos = derrick, tricône, ligne topo.

## Stack (tel que construit)
- **Vite + React + TypeScript** (SPA — **pas** Next.js) · **npm** (`package-lock.json`)
- **Tailwind v3** (`tailwind.config.js`) — mais voir la règle design ci-dessous
- Framer Motion
- Commandes : `npm run dev` · `build` · `preview` · `typecheck`

## Règle design — NON négociable
- La direction est **validée client** (« Field Survey »). Source de vérité : **`DESIGN.md`** et **`PRODUCT.md`** — les lire avant toute modif visuelle.
- Le design vit en **CSS pur dans `src/index.css`** (variables + classes sémantiques). Tailwind est installé mais **à peine utilisé** : **ne pas « tailwind-ifier »**, garder la parité avec le look approuvé.
- **Montserrat uniquement** (choix client, ne pas changer).
- Palette : base blanche + ancre **vert profond** + **UN accent cuivre** par page (≤ ~8 %). **Jamais deux sections vertes empilées.**

## Catalogue produits
- Barre de filtres par marque : les compteurs affichent le **nombre de résultats par marque** (les mettre à jour quand une recherche/filtre est actif, griser les marques à 0).
