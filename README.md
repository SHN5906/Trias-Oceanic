# Trias Oceanic

Site et préparation ERP de Trias Oceanic, distributeur d'équipements pour les mines et l'exploration en Papouasie-Nouvelle-Guinée.

**En ligne :** [trias-oceanic.vercel.app](https://trias-oceanic.vercel.app)

## Contenu du dépôt

| Dossier | Rôle |
|---|---|
| `Website/` | Site vitrine en anglais : catalogue, carte de distribution, demande de devis. React, Vite, Tailwind CSS, MapLibre |
| `ERP/` | Déploiement ERPNext sur Frappe Cloud : documentation, modèles d'import et scripts Python |
| `trias-oceanic-logo/` | Logos |

## Démarrer le site en local

```bash
cd Website
npm ci
npm run dev
```

Le formulaire de contact lit `VITE_FORM_ENDPOINT` (voir `.env.example`).

Le déploiement ERP est détaillé dans [`ERP/README.md`](ERP/README.md).
