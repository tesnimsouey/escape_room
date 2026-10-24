-- Preserve the actual start time while extending shared deadlines.
ALTER TABLE event ADD COLUMN extra_ms INTEGER NOT NULL DEFAULT 0 CHECK (extra_ms >= 0);
