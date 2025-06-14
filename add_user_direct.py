import sqlite3
import hashlib

def hash_password(password):
    """Simple password hashing"""
    return hashlib.sha256(password.encode()).hexdigest()

try:
    conn = sqlite3.connect('instance/dental_app.db')
    cursor = conn.cursor()
    
    # Check if table exists and its structure
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='user'")
    table_info = cursor.fetchone()
    print("Table structure:", table_info)
    
    # Check existing users
    cursor.execute("SELECT email FROM user")
    existing_users = cursor.fetchall()
    print("Existing users:", existing_users)
    
    # Add your user if not exists
    email = 'mhanna-aj@hotmail.com'
    cursor.execute("SELECT * FROM user WHERE email = ?", (email,))
    if not cursor.fetchone():
        # Insert your user
        hashed_password = hash_password('password123')
        cursor.execute("""
            INSERT INTO user (email, password_hash, first_name, last_name, department, position, active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        """, (email, hashed_password, 'Mohammed', 'Hanna', 'Dental', 'Doctor', 1))
        
        conn.commit()
        print(f"User {email} added successfully!")
    else:
        print(f"User {email} already exists!")
    
    # Also add test user
    test_email = 'test@example.com'
    cursor.execute("SELECT * FROM user WHERE email = ?", (test_email,))
    if not cursor.fetchone():
        hashed_password = hash_password('password123')
        cursor.execute("""
            INSERT INTO user (email, password_hash, first_name, last_name, department, position, active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        """, (test_email, hashed_password, 'Test', 'User', 'Dental', 'Doctor', 1))
        
        conn.commit()
        print(f"User {test_email} added successfully!")
    else:
        print(f"User {test_email} already exists!")
    
    # Show all users
    cursor.execute("SELECT email, first_name, last_name FROM user")
    all_users = cursor.fetchall()
    print("All users:", all_users)
    
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc() 