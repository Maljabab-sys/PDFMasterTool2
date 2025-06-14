#!/usr/bin/env python3
"""
User Search and Management Script
This script allows you to search and view all user data in your dental application database.
"""

from api_app import app, db
from config.models import User
import os
from datetime import datetime

def display_database_info():
    """Display information about the database location and status"""
    print("=" * 60)
    print("🗄️  DATABASE INFORMATION")
    print("=" * 60)
    
    # Get database path from app config
    db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    if 'sqlite:///' in db_uri:
        db_path = db_uri.replace('sqlite:///', '')
        abs_path = os.path.abspath(db_path)
        print(f"📍 Database Location: {abs_path}")
        print(f"📁 Database File: {db_path}")
        print(f"✅ Database Exists: {os.path.exists(db_path)}")
        if os.path.exists(db_path):
            size = os.path.getsize(db_path)
            print(f"📊 Database Size: {size} bytes ({size/1024:.2f} KB)")
    else:
        print(f"📍 Database URI: {db_uri}")
    print()

def search_all_users():
    """Display all users in the database with detailed information"""
    with app.app_context():
        try:
            users = User.query.all()
            
            print("=" * 60)
            print("👥 ALL USERS IN DATABASE")
            print("=" * 60)
            print(f"📊 Total Users Found: {len(users)}")
            print()
            
            if not users:
                print("❌ No users found in database!")
                return
            
            for i, user in enumerate(users, 1):
                print(f"👤 USER #{i}")
                print(f"   📧 Email: {user.email}")
                print(f"   👤 Name: {user.first_name} {user.last_name}")
                print(f"   🏢 Department: {user.department}")
                print(f"   💼 Position: {user.position}")
                print(f"   🟢 Active: {'Yes' if user.active else 'No'}")
                print(f"   📅 Created: {user.created_at.strftime('%Y-%m-%d %H:%M:%S') if user.created_at else 'N/A'}")
                print(f"   🕐 Last Login: {user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else 'Never'}")
                
                # Additional fields if they exist
                if hasattr(user, 'clinics') and user.clinics:
                    print(f"   🏥 Clinics: {user.clinics}")
                if hasattr(user, 'notifications_enabled'):
                    print(f"   🔔 Notifications: {'Enabled' if user.notifications_enabled else 'Disabled'}")
                if hasattr(user, 'profile_image') and user.profile_image:
                    print(f"   🖼️  Profile Image: {user.profile_image}")
                
                print("-" * 40)
            
        except Exception as e:
            print(f"❌ Error accessing database: {e}")

def search_user_by_email(email):
    """Search for a specific user by email"""
    with app.app_context():
        try:
            user = User.query.filter_by(email=email).first()
            
            if user:
                print("=" * 60)
                print(f"🔍 USER FOUND: {email}")
                print("=" * 60)
                print(f"👤 Full Name: {user.first_name} {user.last_name}")
                print(f"🏢 Department: {user.department}")
                print(f"💼 Position: {user.position}")
                print(f"🟢 Active: {'Yes' if user.active else 'No'}")
                print(f"📅 Created: {user.created_at.strftime('%Y-%m-%d %H:%M:%S') if user.created_at else 'N/A'}")
                print(f"🕐 Last Login: {user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else 'Never'}")
                
                if hasattr(user, 'clinics') and user.clinics:
                    print(f"🏥 Clinics: {user.clinics}")
                if hasattr(user, 'notifications_enabled'):
                    print(f"🔔 Notifications: {'Enabled' if user.notifications_enabled else 'Disabled'}")
                
                return user
            else:
                print(f"❌ No user found with email: {email}")
                return None
                
        except Exception as e:
            print(f"❌ Error searching for user: {e}")
            return None

def search_users_by_department(department):
    """Search for users by department"""
    with app.app_context():
        try:
            users = User.query.filter_by(department=department).all()
            
            print("=" * 60)
            print(f"🏢 USERS IN DEPARTMENT: {department}")
            print("=" * 60)
            print(f"📊 Users Found: {len(users)}")
            print()
            
            if users:
                for i, user in enumerate(users, 1):
                    print(f"{i}. {user.first_name} {user.last_name} ({user.email}) - {user.position}")
            else:
                print(f"❌ No users found in department: {department}")
                
            return users
            
        except Exception as e:
            print(f"❌ Error searching by department: {e}")
            return []

def get_user_statistics():
    """Display user statistics"""
    with app.app_context():
        try:
            total_users = User.query.count()
            active_users = User.query.filter_by(active=True).count()
            inactive_users = total_users - active_users
            
            # Get department breakdown
            departments = db.session.query(User.department, db.func.count(User.id)).group_by(User.department).all()
            
            print("=" * 60)
            print("📊 USER STATISTICS")
            print("=" * 60)
            print(f"👥 Total Users: {total_users}")
            print(f"🟢 Active Users: {active_users}")
            print(f"🔴 Inactive Users: {inactive_users}")
            print()
            print("🏢 Department Breakdown:")
            for dept, count in departments:
                print(f"   • {dept}: {count} users")
            
        except Exception as e:
            print(f"❌ Error getting statistics: {e}")

def main():
    """Main function to run the user search script"""
    print("🦷 DENTAL APP - USER SEARCH TOOL")
    print("=" * 60)
    
    # Display database info
    display_database_info()
    
    # Show menu
    while True:
        print("\n📋 SEARCH OPTIONS:")
        print("1. 👥 Show all users")
        print("2. 🔍 Search user by email")
        print("3. 🏢 Search users by department")
        print("4. 📊 Show user statistics")
        print("5. 🚪 Exit")
        
        choice = input("\n🔢 Enter your choice (1-5): ").strip()
        
        if choice == '1':
            search_all_users()
        elif choice == '2':
            email = input("📧 Enter email address: ").strip()
            if email:
                search_user_by_email(email)
        elif choice == '3':
            dept = input("🏢 Enter department name: ").strip()
            if dept:
                search_users_by_department(dept)
        elif choice == '4':
            get_user_statistics()
        elif choice == '5':
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please enter 1-5.")

if __name__ == "__main__":
    main() 