# Escape room: Cloudflare deployment and event setup

Prepared for this project on 23 October 2026. This guide uses its existing **Next.js + OpenNext + Cloudflare Workers + D1** setup. It keeps the current team-code sign-in flow. No magic links, email verification service, or automatic email sender are required.

## 1. What runs where

| Component | Location | Purpose |
| --- | --- | --- |
| Next.js pages and assets | Cloudflare Workers, packaged by OpenNext | Join page, player screen, admin console |
| Next.js API routes | The same Worker | Authentication, gameplay, hints, reports, host controls |
| D1 database | Cloudflare D1, bound as `DB` | Teams, shared event clock, attempts, solves, hints, grading |
| Admin password | Worker secret `ADMIN_PASSWORD` | Host sign-in |
| Captain invitations | Your usual email account | Manually send each captain their own team code |

Deploy the whole app as one Worker. You do not need a separate backend server or a static-only Cloudflare Pages deployment. This follows the existing [OpenNext deployment path](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/).

## 2. Prerequisites

- A Cloudflare account with access to Workers and D1.
- Node.js **22 or newer** and npm. The installed Wrangler requires Node 22 or newer.
- This project folder and its `package-lock.json`.
- A strong, unique production admin password.
- A private list mapping each team to its captain's email. Other players' emails are unnecessary.

From the project folder:

```bash
cd /home/laptoptess/Downloads/escape-room
node --version
npm --version
npm ci
npx wrangler login
npx wrangler whoami
```

`npm ci` installs the locked dependencies. Browser login connects Wrangler to your Cloudflare account. Confirm that `whoami` shows the intended account, especially if you belong to several organizations.

## 3. Create the production database

```bash
npx wrangler d1 create escape-room-db
```

Copy the returned database ID into `wrangler.jsonc`, replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`. If this database already exists in the intended account, reuse it rather than creating another one. Find its ID with:

```bash
npx wrangler d1 list
```

Keep this structure in the existing configuration:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "escape-room-db",
    "database_id": "PASTE_THE_REAL_DATABASE_ID_HERE",
    "migrations_dir": "migrations"
  }
]
```

Keep the binding name **`DB`**: the backend reads `env.DB`. The application code and npm scripts currently expect the database name `escape-room-db`.

Cloudflare documents database creation and bindings in its [D1 setup guide](https://developers.cloudflare.com/d1/get-started/).

## 4. Check the Worker configuration

The existing `wrangler.jsonc` already specifies:

| Setting | Project value |
| --- | --- |
| Worker name | `escape-room` |
| Worker entry point | `.open-next/worker.js` |
| Asset directory | `.open-next/assets` |
| Asset binding | `ASSETS` |
| Compatibility flags | `nodejs_compat`, `global_fetch_strictly_public` |
| Investigation time | `35` minutes |
| Final submission grace | `5` minutes |

Set the two timing variables before your event if you need different durations. Keep the OpenNext entry point and asset paths. Keep the compatibility date supported by your installed Wrangler; avoid changing it during the event.

`open-next.config.ts` and `next.config.mjs` are already present. You do not need to regenerate or migrate the project. See [OpenNext's setup reference](https://opennext.js.org/cloudflare/get-started) for the adapter configuration.

## 5. Apply all production migrations

**Local and production databases are separate.** Applying local migrations does not initialize Cloudflare's remote database. Local test teams and winners are not uploaded by deploying the app.

List pending remote migrations, then apply them:

```bash
npx wrangler d1 migrations list escape-room-db --remote
npm run db:remote
```

The migration history must include these files, in order:

1. `0001_init.sql`: creates the event and gameplay tables.
2. `0002_remove_teamwork.sql`: removes the retired teamwork bonus column.
3. `0003_require_team_name.sql`: normalizes legacy names and adds insert/update validation for nonblank names up to 30 characters.

Do not run only the first migration or delete previously applied migration files. Wrangler tracks applied files. The new backend expects the updated schema. See [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/).

For an existing production database, export it before applying new migrations:

```bash
npx wrangler d1 export escape-room-db --remote --output /tmp/escape-room-before-update.sql
```

Keep a copy somewhere durable and private; `/tmp` is temporary. Exports include team access tokens, so do not put them in a public repository or send them to participants.

## 6. Local development and Cloudflare preview

For a fresh local checkout, create `.dev.vars` from `.dev.vars.example` **only if `.dev.vars` does not already exist**, then replace its example password. Keep it out of Git.

```bash
npm run db:local
npm run typecheck
npm run test:rules
npm run preview
```

`preview` builds the OpenNext Worker and runs it locally in Cloudflare's runtime. Open the URL printed by the command. Test the join page and `/admin`. Stop preview with Ctrl+C when finished.

For fast development use `npm run dev`. The local database may be locked while a development or preview process is running: stop the process, apply local migrations, then restart it.

`npm run build` checks the Next.js build; `npm run preview` additionally checks the adapter/runtime path. Do not treat a successful Next.js build alone as proof of a successful Cloudflare deployment. [OpenNext CLI reference](https://opennext.js.org/cloudflare/cli).

Optional local-only test teams:

```bash
npm run db:seed
```

This creates local test teams, not production teams. The scenario test script changes the shared local clock and completes fresh test teams; do not point test runners at the live event.

## 7. First deployment and production password

Deploy after the remote migrations are applied:

```bash
npm run deploy
```

This builds the OpenNext bundle and deploys the Worker. Record the HTTPS URL Wrangler prints, normally a `workers.dev` address. Wait for successful deployment before distributing it.

For this first deployment, immediately set the production password:

```bash
npx wrangler secret put ADMIN_PASSWORD
```

Enter the strong production password at the hidden prompt. This order ensures the Worker exists before setting its secret. Until the secret is set, this app rejects admin login. Do not distribute invitations until host login works.

`.dev.vars` configures local development; it is not the production secret. Never put the password in `wrangler.jsonc`, a browser-visible variable, an email to captains, or a committed file. Subsequent normal deployments preserve existing Worker secrets. [Cloudflare secrets documentation](https://developers.cloudflare.com/workers/configuration/secrets/).

For future password changes, run the same secret command. This application's admin cookies depend on the password, so hosts will need to sign in again.

## 8. Verify the deployed app before inviting teams

Use the actual HTTPS deployment URL:

- `/`: team code and required team name are visible.
- `/admin`: wrong passwords fail; the production password succeeds.
- Teams view: creating teams works; teamwork is absent; codes and join links appear.
- Join a spare test team in another browser/profile. Blank names must fail. Before starting, choose its final name.
- Live scores: start the shared clock and confirm the admin and player screens update.
- Verify puzzle progression, hints, final report, leaderboard, and winner reveal in a rehearsal.
- Reveal Maya's note: only teams with submitted reports see it.
- Refresh the player page: completed progress remains.
- Check phone-sized and desktop layouts over HTTPS.

Use a dedicated staging Worker and separate D1 database for a full rehearsal when possible. If rehearsing in the production database before real play, **Reset all play data** clears every team's scores, attempts, hints and reports, resets the clock and reveal, and keeps the teams. Only use it before the real event, never during it.

Local rehearsal results do not prove the remote deployment is healthy. This document was prepared without deploying to your Cloudflare account.

## 9. Create 25 teams and email the captains

In the **deployed** host console:

1. Open Teams and set Add teams to **25** on an empty event database.
2. Press Create once; this adds 25 teams rather than replacing existing ones.
3. Assign or confirm each team's name before starting the clock.
4. Keep a private mapping of team name, generated code, and captain email.
5. Send one separate email to each captain. Do not share a spreadsheet containing every team's codes.

The app does not currently store captain emails or send email. Use your usual email client or a carefully checked mail merge. No email provider API key is needed for manual sending.

### Suggested invitation

```text
Subject: Escape room access — [Team name]

Hello [Captain name],

Here is your team's access for the Microsoft Club escape room:

Event: [Date, time and timezone]
Team name: [Exact team name]
Team code: [Generated team code]
Join page: [Your deployed HTTPS URL]

Enter the team code and team name, then wait in the lobby.
Please join before the event starts. After the clock starts, use the
same team name when rejoining.

Use one laptop for your team's answers. Keep your code within your team.
If your laptop fails, open the same join page on another laptop and
enter the same code and team name to recover saved progress.
Contact [Organizer/contact] if you need help.
```

Copy a code only from the deployed Teams view. Do not send local `TEST-*` codes or `localhost` links to participants.

In the retained code-based design, the code is an access credential. Knowing the code and matching name allows someone to join that team. Changing devices does **not** revoke the old browser session, and unsent typing is not automatically restored. Team names are not a second authentication factor. Email verification and single-device enforcement were discussed but are not implemented.

## 10. Run the event

- Before starting: verify 25 intended teams, correct captain/code mapping, final team names, and a waiting clock.
- Start the clock once for everyone from Live scores.
- Watch progress and use Review for written-answer adjustments.
- Close submissions when needed. Host locking does not pause the event clock.
- Maximum score is **650**, with hint penalties. Ties use earliest report, then reasoning points.
- Reveal Maya's note at the appropriate time.
- Use Winners to show third, second, then first place.
- Save a remote database export after the event if you need an archive.

The current implementation has one shared event, not separate isolated events for different dates. Back up before resetting for a later event.

## 11. Later deployments and troubleshooting

For an existing deployment, export the remote database, inspect pending migrations, apply them, and deploy:

```bash
npx wrangler d1 export escape-room-db --remote --output /tmp/escape-room-before-update.sql
npx wrangler d1 migrations list escape-room-db --remote
npm run db:remote
npm run deploy
```

The teamwork-removal schema is incompatible with older code that reads that column, so schedule that upgrade outside active play. Code rollback alone does not undo a database migration.

| Symptom | Check |
| --- | --- |
| Database ID placeholder error | Replace the placeholder with the actual D1 ID in the correct account. |
| `no such table` | Run remote migrations for a deployed app; local migrations affect only local data. |
| Database binding missing | Confirm the Worker configuration binds D1 as `DB`, then redeploy. |
| Admin password works locally only | Set `ADMIN_PASSWORD` on the deployed Worker. |
| Join rejects missing name | Team names are required. After start, use the stored exact name. |
| Scores or teams differ from localhost | Local and remote databases are independent. |
| Local `SQLITE_BUSY` | Stop the local app/preview before applying local migrations. |
| Works in development but fails after deploy | Reproduce with `npm run preview`; inspect Worker logs and binding/secret settings. |
| Worker bundle/CPU/database limit error | Inspect the reported limit and your account's current plan before changing plans. |

For live Worker logs:

```bash
npx wrangler tail
```

Use the dashboard's Workers and D1 metrics during a rehearsal. Keep the existing polling traffic in mind: active players poll every four seconds and each admin tab polls every five seconds. Verify account limits with your expected number of devices; team count alone is not a capacity test.

A custom domain is optional. Set it up through the Worker's Domains & Routes settings if needed, then test that final hostname before emailing invitations. Keep everyone on the same hostname because browser sessions are tied to it.
