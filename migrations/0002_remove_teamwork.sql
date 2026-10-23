-- Remove the retired host bonus; all puzzle and report records are retained.
ALTER TABLE teams DROP COLUMN teamwork;
