-- Normalize legacy names, then enforce a nonblank, bounded name on every write.
UPDATE teams SET name = CASE WHEN length(trim(name, '	
                  　﻿')) = 0 THEN 'Team ' || id ELSE substr(trim(name, '	
                  　﻿'), 1, 30) END;
CREATE TRIGGER teams_require_name_insert BEFORE INSERT ON teams
WHEN NEW.name IS NULL OR length(trim(NEW.name, '	
                  　﻿')) NOT BETWEEN 1 AND 30 OR NEW.name != trim(NEW.name, '	
                  　﻿')
BEGIN SELECT RAISE(ABORT, 'Team name is required and must be 1 to 30 characters.'); END;
CREATE TRIGGER teams_require_name_update BEFORE UPDATE OF name ON teams
WHEN NEW.name IS NULL OR length(trim(NEW.name, '	
                  　﻿')) NOT BETWEEN 1 AND 30 OR NEW.name != trim(NEW.name, '	
                  　﻿')
BEGIN SELECT RAISE(ABORT, 'Team name is required and must be 1 to 30 characters.'); END;
