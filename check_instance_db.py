#!/usr/bin/env python3

import sqlite3
import os

def check_instance_database():
    """Check the instance database"""
    db_path = 'instance/dental_app.db'
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("=== INSTANCE DATABASE TABLES ===")
        print(f"Found {len(tables)} tables:")
        
        for table in tables:
            table_name = table[0]
            print(f"\n📋 Table: {table_name}")
            
            # Get table info
            cursor.execute(f"PRAGMA table_info(`{table_name}`)")
            columns = cursor.fetchall()
            
            for col in columns:
                col_name = col[1]
                col_type = col[2]
                print(f"  - {col_name} ({col_type})")
            
            # Get row count (use quotes for reserved words)
            try:
                cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
                count = cursor.fetchone()[0]
                print(f"  📊 Rows: {count}")
            except Exception as e:
                print(f"  ❌ Error counting rows: {e}")
        
        # Check user_settings specifically
        print(f"\n=== USER_SETTINGS DATA ===")
        try:
            cursor.execute("SELECT * FROM user_settings")
            settings = cursor.fetchall()
            
            if settings:
                for setting in settings:
                    print(f"User ID: {setting[1]}")
                    print(f"Full Name: {setting[2] if len(setting) > 2 else 'N/A'}")
                    print(f"Profile Image: {setting[6] if len(setting) > 6 else 'N/A'}")
                    print(f"Updated At: {setting[-1] if len(setting) > 8 else 'N/A'}")
                    print("---")
            else:
                print("No user settings found")
        except Exception as e:
            print(f"Error reading user_settings: {e}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")

if __name__ == "__main__":
    check_instance_database() 