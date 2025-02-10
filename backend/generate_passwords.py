import psycopg2
from werkzeug.security import generate_password_hash

# Database connection details
conn = psycopg2.connect(
    dbname="dunderdata", 
    user="postgres", 
    password="Alaska2013!",  
    host="127.0.0.1", 
    port="5432"
)

# Hardcoded passwords for each user (CHANGE THESE LATER)
user_passwords = {
    "mscott": "worldsbestboss",
    "jhalpe": "prankmaster",
    "dschru": "bearsbeets",
    "shudso": "crosswordking",
    "pvance": "bobvance",
    "amarti": "catsrule",
    "omarti": "numbers",
    "kmalon": "m&ms",
    "tflend": "hrrules",
    "kkapoo": "talkative",
    "pbeesl": "reception1",
    "cbratt": "whoknows",
    "rhowar": "temp123",
    "dwall": "corporateking",
    "jlevin": "strictboss",
    "jbenn": "ceopower",
    "glewis": "tallgabe",
    "dvicke": "basketballrules",
    "abern": "cornellgrad",
    "kfilip": "salesqueen",
    "dcordr": "handsome",
    "mpalme": "whiskeylover",
    "dphilb": "warehouseking",
    "ehanno": "happyreception"
}

# Connect to PostgreSQL
cursor = conn.cursor()

# Update user passwords in the database securely
for username, password in user_passwords.items():
    hashed_password = generate_password_hash(password, method="pbkdf2:sha256", salt_length=16)
    
    cursor.execute(
        "UPDATE users SET password_hash = %s WHERE username = %s",
        (hashed_password, username)
    )
    
    print(f"✅ Updated password for user: {username}")

# Commit changes and close connection
conn.commit()
cursor.close()
conn.close()

print("✅ All passwords updated successfully!")
