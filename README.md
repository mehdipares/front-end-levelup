# LevelUp Frontend Starter

Un starter React (Vite) déjà branché sur `https://level-up-8idt.onrender.com`.

## Démarrage

```bash
npm i
npm run dev
# le serveur démarre sur http://localhost:3001
```

> ⚠️ CORS : le back n'autorise que certains origins (localhost:3001 inclus).
> Si vous préférez Vite en 5173, ajoutez `http://localhost:5173` dans `server.js` (liste `allowedOrigins`) côté back, OU laissez ce projet sur le port 3001.

## Variables

Vous pouvez surcharger l'URL du back via un fichier `.env` à la racine :

```
VITE_API_BASE=https://level-up-8idt.onrender.com
```

## Pages incluses

- Auth : Login, Register (+ stockage JWT + extraction `userId` depuis le token)
- Onboarding : GET `/onboarding/questions`, POST `/onboarding/answers`
- Dashboard : GET `/users/:id`, `/users/:id/priorities`, `/quotes/today`
- Goals : liste des objectifs, complete/archive/unarchive/schedule
- Templates : catalogue des goal-templates et ajout en un clic
- Profile : update email/pseudo

Le code des appels API est centralisé dans `src/api/*`.
