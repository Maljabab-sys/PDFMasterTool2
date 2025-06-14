#!/usr/bin/env python3
"""
Database migration script to add new profile fields to User table
"""

import sqlite3
import os

def migrate_database():
    db_path = 'dental_app.db'
    
    if not os.path.exists(db_path):
        print("Database file not found. Creating new database...")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if the new columns already exist
        cursor.execute("PRAGMA table_info(user)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Add profile_image column if it doesn't exist
        if 'profile_image' not in columns:
            print("Adding profile_image column...")
            cursor.execute("ALTER TABLE user ADD COLUMN profile_image TEXT")
        
        # Add clinics column if it doesn't exist
        if 'clinics' not in columns:
            print("Adding clinics column...")
            cursor.execute("ALTER TABLE user ADD COLUMN clinics TEXT")
        
        # Add notifications_enabled column if it doesn't exist
        if 'notifications_enabled' not in columns:
            print("Adding notifications_enabled column...")
            cursor.execute("ALTER TABLE user ADD COLUMN notifications_enabled BOOLEAN DEFAULT 1")
        
        conn.commit()
        print("Database migration completed successfully!")
        
    except Exception as e:
        print(f"Migration error: {e}")
        conn.rollback()
    
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database() 