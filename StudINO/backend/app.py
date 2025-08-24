from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import psycopg2
from psycopg2 import sql
import bcrypt
import random

salt = os.environ.get("SALT")
DBNAME = os.environ.get("DBNAME")
DBHOST = os.environ.get("DBHOST")
DBPASS = os.environ.get("DBPASS")
DBUSER = os.environ.get("DBUSER")

app = Flask(__name__)
CORS(app)

def getSessions(USERID):
    connection = psycopg2.connect(database=DBNAME, user=DBUSER, password=DBPASS, host=DBHOST, port=5432)
    cursor = connection.cursor()
    query = """
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
            u.userID = %s
        GROUP BY 
            sess.sessionID, sess.createdAt
        ORDER BY 
            sess.createdAt DESC
        LIMIT 15;
    """
    cursor.execute(query, (USERID,))
    return cursor.fetchall()

def genCode():
    chars = '123456789ABCD'
    random_string = ''.join(random.choices(chars, k=10))
    return random_string

def userScore(USERID):
    try:
        id = str(USERID)
        connection = psycopg2.connect(database=DBNAME, user=DBUSER, password=DBPASS, host=DBHOST, port=5432)
        cursor = connection.cursor()
        cursor.execute("""SELECT score FROM users WHERE userid = %s;""", (id,))
        data = cursor.fetchall()

        if(len(data) != 1):
            raise Exception("User not valid")
        
        return data[0][0]
    except Exception as e:
        return -50
    
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

def update(USERID, updateType):
    try:
        connection = psycopg2.connect(database=DBNAME, user=DBUSER, password=DBPASS, host=DBHOST, port=5432)
        cursor = connection.cursor()

        # Everything inside one DO block
        query = sql.SQL("""
            DO $$
            DECLARE
                last_update TIMESTAMP;
                most_recent_session_id INT;
                valid_session_id INT;
            BEGIN
                SELECT su.updateAt
                INTO last_update
                FROM session_updates su
                JOIN sessions s ON su.sessionID = s.sessionID
                WHERE s.userID = {user_id}
                ORDER BY su.updateAt DESC
                LIMIT 1;

                IF last_update < NOW() - INTERVAL '3 hours' THEN
                    UPDATE sessions
                    SET ongoing = FALSE
                    WHERE userID = {user_id} AND ongoing = TRUE;

                    INSERT INTO sessions(userID)
                    VALUES({user_id})
                    RETURNING sessionID INTO most_recent_session_id;

                    INSERT INTO session_updates(updateType, sessionID)
                    VALUES({update_type}, most_recent_session_id);

                ELSE
                    SELECT sessionID INTO valid_session_id
                    FROM sessions
                    WHERE userID = {user_id}
                    ORDER BY createdAt DESC
                    LIMIT 1;

                    IF valid_session_id IS NOT NULL THEN
                        INSERT INTO session_updates(updateType, sessionID)
                        VALUES({update_type}, valid_session_id);
                    ELSE
                        INSERT INTO sessions(userID)
                        VALUES({user_id})
                        RETURNING sessionID INTO most_recent_session_id;

                        INSERT INTO session_updates(updateType, sessionID)
                        VALUES({update_type}, most_recent_session_id);
                    END IF;
                END IF;

                -- Conditional score update based on updateType
                IF {update_type} = 0 THEN
                    UPDATE users
                    SET score = CASE
                                    WHEN score < 96 THEN score + 3
                                    ELSE 99
                                END
                    WHERE userID = {user_id};
                ELSIF {update_type} = 1 THEN
                    UPDATE users
                    SET score = CASE
                                    WHEN score > 63 THEN score - 3
                                    ELSE 60
                                END
                    WHERE userID = {user_id};
                END IF;

            END $$;
        """).format(
            user_id=sql.Literal(USERID),
            update_type=sql.Literal(updateType)
        )

        cursor.execute(query)
        connection.commit()

        score = userScore(USERID)
        return score

    except Exception as e:
        print(f"Error updating score: {e}")
        return -50

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@app.route("/ESP8266/createAccount", methods=["POST"])
def espCreateAccount():
    try:
        body = request.get_json()
        
        email = body["email"]
        password = body["password"]
        firstname = body["firstName"]
        lastname = body["lastName"]
        
        if("@" not in email or (".com" or ".ca") not in email):
            raise Exception("Invalid email")
        if(len(password) < 4):
            raise Exception("Password too short (must be at least 4 characters)")

        #SWITCH THESE FOR THE ENV VARIABLES
        connection = psycopg2.connect(database=DBNAME, user=DBUSER, password=DBPASS, host=DBHOST, port=5432)
        cursor = connection.cursor()
        cursor.execute(f"SELECT userID FROM users WHERE email = '{email}';")  
        users = cursor.fetchall()
        if(len(users) > 0):
            raise Exception("User already exists")

        passBytes = password.encode('utf-8')
        hashed = bcrypt.hashpw(passBytes, salt.encode('utf-8')).decode('utf-8')
        
        while True:
            code = genCode()
            cursor.execute(f"SELECT email FROM users WHERE userID = '{code}';")
            if(len(cursor.fetchall()) == 0):
                break

        cursor.execute("""
            INSERT INTO users (firstName, lastName, email, password, userID)
            VALUES (%s, %s, %s, %s, %s);
        """, (firstname, lastname, email, hashed, code))

        connection.commit()
        connection.close()

        return jsonify({
            "success": True,
            "msg": "Registered user"
        }), 201

    except Exception as e:
        print(str(e))
        return jsonify({
            "success": False,
            "msg": str(e)
        }), 406

@app.route("/ESP8266/loginAccount", methods=["POST"])
def espLoginAccount():
    try:
        body = request.get_json()
        email = body["email"]
        password = body["password"]
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt.encode('utf-8')).decode('utf-8')

        connection = psycopg2.connect(database=DBNAME, user=DBUSER, password=DBPASS, host=DBHOST, port=5432)
        cursor = connection.cursor()
        
        cursor.execute(
        """
            SELECT userID, firstName, lastName, email, score FROM users
            WHERE email = %s
            AND password = %s;
        """, (email, hashed))

        users = cursor.fetchall()
        length = len(users)
        if(length > 1):
            raise Exception("Error please try again later")
        elif(length == 0):
            raise Exception("User not found")
        elif(length != 1):
            raise Exception("Error unknown user")

        return jsonify({
            "success": True,
            "msg": "Login Successfull",
            "user":{
                "userid": users[0][0],
                "firstName": users[0][1],
                "lastName": users[0][2],
                "email": users[0][3],
                "score": users[0][4]
            }
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "msg": str(e)
        }), 400
    
@app.route("/ESP8266/userCode/<USERID>", methods=["GET"])
def espGetUserCode(USERID):
    try:
        connection = psycopg2.connect(database=DBNAME, user=DBUSER, password=DBPASS, host=DBHOST, port=5432)
        cursor = connection.cursor()
        cursor.execute(f"SELECT email FROM users WHERE userID = '{USERID}';")
        res = cursor.fetchall()
        if(not res and len(res) != 1):
            raise Exception("NOPE")
        
        return jsonify({
            "codeWork": True
    })

    except Exception as e:
        return jsonify({
            "codeWork": False
        })

@app.route("/ESP8266/getUserScore/<USERID>", methods=["GET"])
def espGetUserScore(USERID):
    try:
        score = userScore(USERID)
        
        return jsonify({
            "success": True,
            "score": score
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "err": str(e)
        })

@app.route("/ESP8266/updateHurt/<USERID>", methods=["GET"])
def espUpdateUserScoreHurt(USERID):
    try:
        score = update(USERID, 1)
        
        return jsonify({
            "success": True,
            "score": score
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "err": str(e)
        })

@app.route("/ESP8266/updateGood/<USERID>", methods=["GET"])
def espUpdateUserScoreGood(USERID):
    try:
        score = update(USERID, 0)
        
        return jsonify({
            "success": True,
            "score": score
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "err": str(e)
        })

@app.route("/ESP8266/sessionStats/<USERID>", methods=["GET"])
def espGetSessions(USERID):
    try:
        sessions = getSessions(USERID)

        return jsonify({
            "success": True,
            "sessions": sessions
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "err": str(e)
        })

if __name__ == "__main__":
    print(os.getenv("PORT"))
    port = os.getenv("PORT") or 3000
    print(f"running on port {port}")
    app.run(debug=True, port=port)
