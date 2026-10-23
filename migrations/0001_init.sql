-- One row: the shared event clock and switches.
CREATE TABLE event (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  started_at INTEGER,
  locked INTEGER NOT NULL DEFAULT 0,
  revealed INTEGER NOT NULL DEFAULT 0
);
INSERT INTO event (id) VALUES (1);

CREATE TABLE teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  variant TEXT NOT NULL,
  teamwork INTEGER NOT NULL DEFAULT 0,
  finished_at INTEGER,
  created_at INTEGER NOT NULL
);

-- A puzzle solved = envelope opened. Puzzles are solved strictly in order.
CREATE TABLE solves (
  team_id INTEGER NOT NULL,
  puzzle INTEGER NOT NULL,
  solved_at INTEGER NOT NULL,
  points INTEGER NOT NULL,
  PRIMARY KEY (team_id, puzzle)
);

-- Every submission (right or wrong) for the audit trail.
CREATE TABLE attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  puzzle INTEGER NOT NULL,
  answer TEXT NOT NULL,
  correct INTEGER NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX attempts_team ON attempts (team_id, at);

-- Each row is one hint level a team requested (costs 15 points).
CREATE TABLE hints (
  team_id INTEGER NOT NULL,
  puzzle INTEGER NOT NULL,
  level INTEGER NOT NULL,
  used_at INTEGER NOT NULL,
  PRIMARY KEY (team_id, puzzle, level)
);

-- Scored items: written explanations ('reason') and report fields ('field').
-- Effective points = COALESCE(admin_points, auto_points).
CREATE TABLE graded (
  team_id INTEGER NOT NULL,
  item TEXT NOT NULL,
  kind TEXT NOT NULL,
  text TEXT NOT NULL,
  max_points INTEGER NOT NULL,
  auto_points INTEGER NOT NULL,
  admin_points INTEGER,
  at INTEGER NOT NULL,
  PRIMARY KEY (team_id, item)
);
