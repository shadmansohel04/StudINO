SELECT userID, password FROM users WHERE email = ?;

SELECT userID, firstName, lastName FROM users
WHERE email = ?
AND password = ?;


-- SESSION DATA
SELECT 
    sess.sessionID,
    sess.createdAt,
    ROUND(EXTRACT(EPOCH FROM MAX(su.updateAt) - sess.createdAt) / 60, 2) AS TotalTimeMinutes,
    SUM(
        CASE 
            WHEN su.updateType = 0 THEN 3
            WHEN su.updateType = 1 THEN -3
            ELSE 0
        END
    ) AS Score
FROM 
    session_updates su
JOIN 
    sessions sess ON su.sessionID = sess.sessionID
JOIN 
    users u ON sess.userID = u.userID
WHERE 
    u.userID = ?
GROUP BY 
    sess.sessionID, sess.createdAt
ORDER BY 
    sess.createdAt DESC
LIMIT 15;
