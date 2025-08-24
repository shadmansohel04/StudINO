DO $$
DECLARE
    last_update TIMESTAMP;
    most_recent_session_id INT;
    valid_session_id INT;
BEGIN
    -- Only proceed if the user exists and is live
    IF EXISTS (
        SELECT 1
        FROM users
        WHERE userID = ?
        AND live = TRUE
    ) THEN

        SELECT su.updateAt
        INTO last_update
        FROM session_updates su
        JOIN sessions s ON su.sessionID = s.sessionID
        JOIN users us ON s.userID = us.userID
        WHERE us.userID = ?
        AND us.live = TRUE
        ORDER BY su.updateAt DESC
        LIMIT 1;

        IF last_update IS NULL OR last_update < NOW() - INTERVAL '3 hours' THEN
            UPDATE sessions
            SET ongoing = FALSE
            WHERE userID = ? AND ongoing = TRUE;

            INSERT INTO sessions(userID)
            VALUES(?)
            RETURNING sessionID INTO most_recent_session_id;

            INSERT INTO session_updates(updateType, sessionID)
            VALUES(0, most_recent_session_id);

        ELSE
            SELECT sessionID INTO valid_session_id
            FROM sessions
            WHERE userID = ?
            ORDER BY createdAt DESC
            LIMIT 1;

            IF valid_session_id IS NOT NULL THEN
                INSERT INTO session_updates(updateType, sessionID)
                VALUES(0, valid_session_id);
            ELSE
                INSERT INTO sessions(userID)
                VALUES(?)
                RETURNING sessionID INTO most_recent_session_id;

                INSERT INTO session_updates(updateType, sessionID)
                VALUES(0, most_recent_session_id);
            END IF;
        END IF;

        UPDATE users
        SET score = CASE
                        WHEN score < 96 THEN score + 3
                        ELSE 99
                    END
        WHERE userID = ?
        AND live = TRUE;

    END IF;
END $$;
