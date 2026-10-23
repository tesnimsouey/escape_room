# The Case of the Missing Innovation (digital escape room)

Next.js on Cloudflare Workers (OpenNext) with Cloudflare D1 for scores.

Deployment URL: https://escape-room.case-of-the-missing-innovation.workers.dev

See [deployment status](DEPLOYMENT_STATUS.md) for verification and [the deployment guide](CLOUDFLARE_DEPLOYMENT.md) for setup.

## Run it locally
```
npm install
cp .dev.vars.example .dev.vars      # set ADMIN_PASSWORD
npm run db:local                    # creates the local D1 tables
npm run dev                         # http://localhost:3000  (host console at /admin)
```

## Deploy to Cloudflare

See [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md) for the complete setup, captain email process, and event checklist.

```
npx wrangler login
npx wrangler d1 create escape-room-db     # copy the database_id into wrangler.jsonc
npm run db:remote                         # creates the tables in the real database
npm run deploy
npx wrangler secret put ADMIN_PASSWORD    # set the host password after the first deploy
```
Timer settings live in `wrangler.jsonc` (`INVESTIGATION_MINUTES` 35, `GRACE_MINUTES` 5).

## Event-day checklist
1. Open `/admin`, sign in, go to Teams, create one team per group. Share each team's join link or code.
2. Do a dry run with a spare team, then press "Reset all play data" on Live scores.
3. Teams join and see the lobby. Press "Start the clock" and everyone's first envelope opens.
4. Watch Live scores. Use Review to adjust any written answer.
5. When done, press "Reveal Maya's note", then use Winners to show 3rd, 2nd, 1st.

## Scoring
Each puzzle: 60 for the answer + up to 40 for the explanation. Final report: 100. Verification: 50.
Hints: minus 15 each (3 per puzzle). Maximum 650.
Ties: earliest final report, then the higher reasoning score.

## Where things are
- `src/lib/content.ts`  puzzle text shown to players (safe for the browser)
- `src/lib/keys.ts`     answers, hints, keyword rubrics, reveal text (server only)
- `migrations/`         D1 schema

## Local test teams

Run `npm run db:seed` after `npm run db:local` to add six local test teams,
two per puzzle variant. Codes are `TEST-01` through `TEST-06`. Re-running
preserves existing teams and progress; this command only targets the local database.
Open the printed join links in separate browser profiles or different browsers
to test simultaneous teams. Tabs in one browser profile share the team session.

## Scenario checks

`npm run test:rules` checks timer boundaries and ranking tie-breaks.
`npm run test:scenarios` plays all six fresh test teams through the running local app
(default `http://localhost:3000`; override with `TEST_BASE_URL`). It reads the local
admin password without printing it. This changes the shared event clock, completes
the test teams, and leaves the event locked and revealed.
It requires fresh test teams and does not delete existing play data.
See `SCENARIO_TEST_RESULTS.md` for results and coverage limitations.

Existing databases: run `npm run db:local` to apply pending migrations. For deployment, apply `npm run db:remote` before deploying the updated app. The migrations remove the retired host bonus and enforce required team names; puzzle, report and hint data are preserved.
