#!/usr/bin/env python3
"""
Quick User Search - Simple script to quickly view all users
"""

from api_app import app, db
from config.models import User
import os

def quick_search():
    """Quick display of all users"""
    with app.app_context():
        try:
            # Get database info
            db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
            if 'sqlite:///' in db_uri:
                db_path = db_uri.replace('sqlite:///', '')
                abs_path = os.path.abspath(db_path)
                print(f"📍 Database: {abs_path}")
                print(f"✅ Exists: {os.path.exists(db_path)}")
                print()
            
            # Get all users
            users = User.query.all()
            
            print("=" * 50)
            print("👥 ALL USERS IN DATABASE")
            print("=" * 50)
            print(f"📊 Total Users: {len(users)}")
            print()
            
            if not users:
                print("❌ No users found!")
                return
            
            for i, user in enumerate(users, 1):
                print(f"{i}. 📧 {user.email}")
                print(f"   👤 {user.first_name} {user.last_name}")
                print(f"   💼 {user.position} - {user.department}")
                print(f"   🟢 Active: {'Yes' if user.active else 'No'}")
                if user.created_at:
                    print(f"   📅 Created: {user.created_at.strftime('%Y-%m-%d')}")
                print("-" * 30)
                
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    quick_search() 