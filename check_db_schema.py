#!/usr/bin/env python3

import sqlite3
import os

def check_user_settings_schema():
    """Check the UserSettings table schema"""
    db_path = 'dental_app.db'
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get table info
        cursor.execute("PRAGMA table_info(user_settings)")
        columns = cursor.fetchall()
        
        print("=== USER_SETTINGS TABLE SCHEMA ===")
        print(f"Found {len(columns)} columns:")
        
        expected_columns = [
            'id', 'user_id', 'full_name', 'email', 'position', 'gender', 
            'profile_image', 'clinics_data', 'specialty', 'notifications', 
            'auto_save', 'dark_mode', 'language', 'created_at', 'updated_at'
        ]
        
        existing_columns = []
        for col in columns:
            col_name = col[1]
            col_type = col[2]
            existing_columns.append(col_name)
            print(f"  ✅ {col_name} ({col_type})")
        
        print(f"\n=== MISSING COLUMNS CHECK ===")
        missing_columns = []
        for expected in expected_columns:
            if expected not in existing_columns:
                missing_columns.append(expected)
                print(f"  ❌ MISSING: {expected}")
        
        if not missing_columns:
            print("  ✅ All expected columns are present!")
        else:
            print(f"  🚨 {len(missing_columns)} columns are missing!")
        
        # Check current user settings data
        print(f"\n=== CURRENT USER SETTINGS DATA ===")
        cursor.execute("SELECT * FROM user_settings")
        settings = cursor.fetchall()
        
        if settings:
            for setting in settings:
                print(f"User ID: {setting[1]}")
                print(f"Profile Image: {setting[6] if len(setting) > 6 else 'N/A'}")
                print(f"Updated At: {setting[-1] if len(setting) > 8 else 'N/A'}")
                print("---")
        else:
            print("No user settings found")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")

if __name__ == "__main__":
    check_user_settings_schema() 