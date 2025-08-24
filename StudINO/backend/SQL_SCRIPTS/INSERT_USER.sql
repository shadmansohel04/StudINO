-- THIS IS FOR ADDING A PERSON
-- HAVE IT SO THE PASSWORD IS HASHED

INSERT INTO users(firstName, lastName, email, password)
VALUES(?, ?, ?, ?);

-- THIS IS HOW YOU CREATE A NEW SESSION
-- YOU WOULD STORE THE USER_ID SOMEWHERE
-- ENCRYPT IT ON THE FRONTEND AND SEND TO BACKEND TO DECRIPT IT

INSERT INTO sessions(userID)
VALUES(1);

-- UPDATE_TYPE == 0 : BAD
-- UPDATE_TYPE == 1 : GOOD
INSERT INTO session_updates(sessionID, updateType, updateScore)
VALUES(1, 0, -10);

-- AFTER SESSION_UPDATES RUNS CALL THIS
UPDATE sessions
SET sessionScore = CASE
                        WHEN sessionScore + -10 > 100 THEN 100
                        WHEN sessionScore + -10 < 0 THEN 0
                        ELSE sessionScore + -10
                    END
WHERE sessionID = 1;