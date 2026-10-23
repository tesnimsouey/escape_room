# Current scoring verification

The retired host bonus was removed from the schema, API, UI and scoring. Maximum: 650.

## Current winners

1. Test Team 2: 650 points
2. Test Team 3: 650 points
3. Test Team 1 — Champions: 650 points

Verified: overview excludes retired fields; every team total equals puzzle points plus report points minus hint penalties; the retired action returns 400. Migration preserved all team and play records. Production build and TypeScript passed.

Earlier gameplay run passed 186 HTTP checks across all routes before this scoring change. The scenario runner is updated for the new scoring; a fresh full gameplay run was not performed on completed teams.
