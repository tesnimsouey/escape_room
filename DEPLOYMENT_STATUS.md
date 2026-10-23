# Cloudflare production deployment

Verified on 23 October 2026.

- App: https://escape-room.case-of-the-missing-innovation.workers.dev
- Host console: https://escape-room.case-of-the-missing-innovation.workers.dev/admin
- GitHub: https://github.com/tesnimsouey/escape_room
- Worker: `escape-room`.
- D1: `escape-room-db`, bound as `DB`.
- Investigation: 35 minutes; final-submission grace: 5 minutes.

## Completed

- Replaced the placeholder database ID with the existing Cloudflare database ID.
- Removed the duplicate database binding; the backend uses `DB`.
- Explicitly enabled the Worker's `workers.dev` route.
- Applied all three remote database migrations, including teamwork removal and required-name validation.
- Built the OpenNext Worker bundle and deployed it successfully.
- Configured a unique production `ADMIN_PASSWORD` secret.
- Confirmed the public HTTPS hostname works after initial provisioning.
- Verified remote schema, name-validation triggers, and migration history.
- Passed TypeScript and nine timer/ranking checks.
- Passed 21 live HTTP checks: public pages, unauthorized API protection, wrong-password rejection, valid admin login with Secure/HttpOnly cookie, overview/database access, blank/invalid team-name rejection, nonexistent team rejection, invalid rename rejection, and retirement of the teamwork action.

Production remains in the lobby with zero teams. Local test teams, scores, and winners were not copied into production. No captain emails were sent. Create event teams in the deployed host console and distribute their codes when ready.

## Host credential

The production admin password is stored locally in `.secrets/production.json`, with owner-only file permissions, and deployed as a Worker secret. That directory is excluded from Git. Open this local file to retrieve the password; the repository does not contain it. The local development password is separate.

## Operations

See [the deployment guide](CLOUDFLARE_DEPLOYMENT.md) for setup, updates, event management, captain emails, backup commands, and troubleshooting.

This deployment verification did not run a full gameplay rehearsal on production or create production test teams. The earlier complete gameplay rehearsal used the local database.
