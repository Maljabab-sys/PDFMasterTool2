#!/usr/bin/env python3

import sqlite3
import os

def check_all_tables():
    """Check all tables in the database"""
    db_path = 'dental_app.db'
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("=== ALL TABLES IN DATABASE ===")
        print(f"Found {len(tables)} tables:")
        
        for table in tables:
            table_name = table[0]
            print(f"\n📋 Table: {table_name}")
            
            # Get table info
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            
            for col in columns:
                col_name = col[1]
                col_type = col[2]
                print(f"  - {col_name} ({col_type})")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")

if __name__ == "__main__":
    check_all_tables() 