from werkzeug.security import generate_password_hash, check_password_hash
from backend.database import get_connection


# =========================================================
# PASSWORD HASHING
# =========================================================

def hash_password(password):
    return generate_password_hash(password)


def verify_password(password, password_hash):
    return check_password_hash(password_hash, password)


# =========================================================
# CREATE ADMIN ACCOUNT
# =========================================================

def create_admin():

    conn = get_connection()

    email = "admin@retinaai.com"
    password = "admin123"

    existing = conn.execute(
        """
        SELECT id
        FROM users
        WHERE email = ?
        """,
        (email,)
    ).fetchone()

    if existing:

        print("⚠️ Admin already exists!")

        conn.close()

        return

    password_hash = hash_password(password)

    conn.execute(
        """
        INSERT INTO users
        (
            name,
            email,
            password_hash,
            role
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            "RetinaAI Admin",
            email,
            password_hash,
            "admin"
        )
    )

    conn.commit()
    conn.close()

    print("========================================")
    print("      RETINAAI ADMIN CREATED")
    print("========================================")
    print("Email:", email)
    print("Password:", password)
    print("========================================")


# =========================================================
# TEST
# =========================================================

if __name__ == "__main__":
    create_admin()