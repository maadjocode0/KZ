# KZ Café Lounge — Menu & Commande en ligne

Application web de **menu digital et de prise de commande** pour le **KZ Café Lounge** (Bardo, Tunisie).
Les clients consultent le menu et passent commande depuis leur table via un QR code ; le personnel
suit les commandes en temps réel depuis une interface de caisse (POS).

> Ce projet est dérivé du même template que Tanit Lounge. La spécification réutilisable complète
> se trouve dans [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md).

## Fonctionnalités

- **Menu client** ([`index.html`](index.html)) : 33 catégories repliables, recherche, images par catégorie, variantes (Simple/Double…).
- **Panier** ([`cart.html`](cart.html)) : ajout/retrait d'articles, total, confirmation de table par scan QR
  (ou paramètre `?table=`) et envoi de la commande.
- **Suivi de commande** ([`track.html`](track.html)) : statut en direct + notation du service.
- **Espace staff** : connexion ([`login.html`](login.html)), caisse ([`pos.html`](pos.html)),
  gestion du menu ([`admin.html`](admin.html)), rapport des ventes ([`report.html`](report.html)),
  générateur de QR codes par table ([`qr.html`](qr.html)).

## Stack technique

- HTML / CSS / JavaScript **vanilla** (aucun build).
- [Supabase](https://supabase.com) (REST + Auth + Storage) comme back-end.
- Polices Google Fonts + icônes Font Awesome via CDN. Déploiement sur Vercel.

## Le menu (source de vérité)

Tout le menu vit dans [`menu-data.js`](menu-data.js) (`MENU_DATA`). ⚠️ Chaque `name` doit être
**unique** dans tout le menu : le panier indexe les lignes par nom d'affichage, donc deux articles
homonymes (ex. « Nutella » présent dans plusieurs sections) fusionneraient. C'est pourquoi les noms
répétés sont préfixés par leur section (`Crêpe Nutella`, `Milkshake Nutella`, `Chocolat Nutella`…).

## Lancer en local

Projet 100 % statique. Servez le dossier avec un serveur HTTP statique :

```bash
npx http-server -p 8000 -c-1
```

Puis ouvrez http://localhost:8000. (Le scan QR caméra et le service worker exigent HTTPS en production —
Vercel le fournit.)

## Mise en service (nouveau client) — voir `PROJECT_BRIEF.md` §10

1. Créer un projet **Supabase** dédié à KZ (ne pas réutiliser celui d'un autre client).
2. Copier l'**URL** + la **clé publishable (anon)** dans [`supabase.js`](supabase.js).
3. Exécuter [`supabase-setup.sql`](supabase-setup.sql) dans l'éditeur SQL Supabase.
4. Auth → Email → désactiver « Confirm email », puis créer le compte staff.
5. Pousser sur GitHub `main` → connecter à **Vercel** (déploiement auto).
6. Ouvrir `…/qr.html` sur le domaine en ligne, générer et imprimer les QR codes des tables.

## À personnaliser avant la prod

- **Coordonnées** dans `index.html` (toutes confirmées par le client) : téléphone +216 58 890 656, horaires (tous les jours 08:00–00:00), Instagram [`kzed_cafelounge`](https://www.instagram.com/kzed_cafelounge/), Facebook, et la carte Google Maps (recherche de lieu, Bardo).
- **Logo** : `icon.svg` / `favicon.svg` (monogramme KZ). Remplaçables par le logo officiel.
