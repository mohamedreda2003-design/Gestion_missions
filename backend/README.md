# Initialisation et sécurité

1. Sélectionnez la base utilisée par `DB_NAME` (local) ou `MYSQLDATABASE` (Railway), puis exécutez `database/schema.sql` dans cette base.
2. Configurez `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` et `SESSION_SECRET`. Cette dernière variable doit contenir au moins 32 caractères aléatoires. Ne la publiez pas et ne la mettez pas dans Git.
3. Créez le premier compte une seule fois avec `ADMIN_LOGIN` et `ADMIN_PASSWORD` dans l'environnement, puis `npm run bootstrap-admin`. Choisissez un mot de passe unique de 12 caractères minimum et retirez ensuite ces deux variables.

La connexion passe par `/api/auth/login`, avec un cookie `HttpOnly`, `SameSite=Lax` et `Secure` en production. Les routes métier exigent une session signée valide. `/api/users` est réservé aux administrateurs et ne renvoie jamais les hash de mot de passe. Gardez l'API privée jusqu'à la fin des contrôles des autorisations métier par rôle et des parcours de l'application.
