import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const DB_PATH = process.env.DATABASE_PATH || 'data/mormorsspill.db';

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS space (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  theme TEXT DEFAULT 'viking',
  include_guests_in_rankings INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS member (
  id INTEGER PRIMARY KEY,
  space_id INTEGER NOT NULL REFERENCES space(id),
  display_name TEXT NOT NULL,
  avatar TEXT,
  pin_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS guest (
  id INTEGER PRIMARY KEY,
  space_id INTEGER NOT NULL REFERENCES space(id),
  display_name TEXT NOT NULL,
  avatar TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS game (
  id INTEGER PRIMARY KEY,
  space_id INTEGER NOT NULL REFERENCES space(id),
  status TEXT NOT NULL DEFAULT 'lobby',
  current_round INTEGER NOT NULL DEFAULT 1,
  dealer_seat INTEGER NOT NULL DEFAULT 0,
  single_scorer INTEGER NOT NULL DEFAULT 0,
  winner_participant_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  started_at TEXT,
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS participant (
  id INTEGER PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES game(id),
  member_id INTEGER REFERENCES member(id),
  guest_id INTEGER REFERENCES guest(id),
  seat INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS round (
  id INTEGER PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES game(id),
  number INTEGER NOT NULL,
  objective TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  round_winner_participant_id INTEGER
);

CREATE TABLE IF NOT EXISTS score (
  id INTEGER PRIMARY KEY,
  round_id INTEGER NOT NULL REFERENCES round(id),
  participant_id INTEGER NOT NULL REFERENCES participant(id),
  card_points INTEGER NOT NULL DEFAULT 0,
  penalty INTEGER NOT NULL DEFAULT 0,
  entered_by_participant_id INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(round_id, participant_id)
);

CREATE TABLE IF NOT EXISTS event (
  id INTEGER PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES game(id),
  type TEXT NOT NULL,
  payload_json TEXT,
  actor_participant_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_member_space ON member(space_id);
CREATE INDEX IF NOT EXISTS idx_game_space ON game(space_id);
CREATE INDEX IF NOT EXISTS idx_participant_game ON participant(game_id);
CREATE INDEX IF NOT EXISTS idx_round_game ON round(game_id);
CREATE INDEX IF NOT EXISTS idx_score_round ON score(round_id);
CREATE INDEX IF NOT EXISTS idx_event_game ON event(game_id);
`;

db.exec(SCHEMA);
