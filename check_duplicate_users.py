#!/usr/bin/env python3

import os
import sys
from flask import Flask
from config.database import db
from config.models import User, UserSettings

# Create Flask app for database context
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///dental_app.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
db.init_app(app)

def check_duplicate_users():
    """Check for duplicate users and profile conflicts"""
    with app.app_context():
        print("=== CHECKING FOR DUPLICATE USERS ===")
        
        # Check for duplicate emails
        print("\n1. CHECKING FOR DUPLICATE EMAILS:")
        users = User.query.all()
        email_counts = {}
        
        for user in users:
            email = user.email.lower()
            if email in email_counts:
                email_counts[email].append(user)
            else:
                email_counts[email] = [user]
        
        duplicates_found = False
        for email, user_list in email_counts.items():
            if len(user_list) > 1:
                duplicates_found = True
                print(f"\n🚨 DUPLICATE EMAIL FOUND: {email}")
                for user in user_list:
                    print(f"   - User ID: {user.id}, Name: {user.first_name} {user.last_name}, Created: {user.created_at}")
                    
                    # Check their settings
                    settings = UserSettings.query.filter_by(user_id=user.id).first()
                    if settings:
                        print(f"     Settings: Full Name: '{settings.full_name}', Profile Image: {settings.profile_image}")
                    else:
                        print(f"     No settings found")
        
        if not duplicates_found:
            print("✅ No duplicate emails found")
        
        # Check current user specifically
        print(f"\n2. CHECKING CURRENT USER (mhanna-aj@hotmail.com):")
        current_users = User.query.filter_by(email='mhanna-aj@hotmail.com').all()
        
        if len(current_users) > 1:
            print(f"🚨 FOUND {len(current_users)} USERS WITH EMAIL 'mhanna-aj@hotmail.com':")
            for i, user in enumerate(current_users, 1):
                print(f"\n   User #{i}:")
                print(f"   - ID: {user.id}")
                print(f"   - Name: {user.first_name} {user.last_name}")
                print(f"   - Created: {user.created_at}")
                print(f"   - Last Login: {user.last_login}")
                
                # Check settings for each user
                settings = UserSettings.query.filter_by(user_id=user.id).first()
                if settings:
                    print(f"   - Full Name in Settings: '{settings.full_name}'")
                    print(f"   - Profile Image: {settings.profile_image}")
                    print(f"   - Updated: {settings.updated_at}")
                else:
                    print(f"   - No UserSettings found")
        elif len(current_users) == 1:
            user = current_users[0]
            print(f"✅ Found 1 user with email 'mhanna-aj@hotmail.com':")
            print(f"   - ID: {user.id}")
            print(f"   - Name: {user.first_name} {user.last_name}")
            
            settings = UserSettings.query.filter_by(user_id=user.id).first()
            if settings:
                print(f"   - Profile Image: {settings.profile_image}")
            else:
                print(f"   - No UserSettings found")
        else:
            print("❌ No user found with email 'mhanna-aj@hotmail.com'")
        
        # Check for orphaned UserSettings
        print(f"\n3. CHECKING FOR ORPHANED USER SETTINGS:")
        all_settings = UserSettings.query.all()
        orphaned_settings = []
        
        for setting in all_settings:
            user = User.query.filter_by(id=setting.user_id).first()
            if not user:
                orphaned_settings.append(setting)
        
        if orphaned_settings:
            print(f"🚨 FOUND {len(orphaned_settings)} ORPHANED SETTINGS:")
            for setting in orphaned_settings:
                print(f"   - Settings ID: {setting.id}, User ID: {setting.user_id} (USER NOT FOUND)")
                print(f"     Profile Image: {setting.profile_image}")
        else:
            print("✅ No orphaned settings found")
        
        # Check for multiple settings per user
        print(f"\n4. CHECKING FOR MULTIPLE SETTINGS PER USER:")
        user_settings_counts = {}
        for setting in all_settings:
            if setting.user_id in user_settings_counts:
                user_settings_counts[setting.user_id].append(setting)
            else:
                user_settings_counts[setting.user_id] = [setting]
        
        multiple_settings_found = False
        for user_id, settings_list in user_settings_counts.items():
            if len(settings_list) > 1:
                multiple_settings_found = True
                user = User.query.filter_by(id=user_id).first()
                user_email = user.email if user else "USER NOT FOUND"
                print(f"🚨 USER {user_id} ({user_email}) HAS {len(settings_list)} SETTINGS:")
                for i, setting in enumerate(settings_list, 1):
                    print(f"   Setting #{i}: ID={setting.id}, Profile Image={setting.profile_image}, Updated={setting.updated_at}")
        
        if not multiple_settings_found:
            print("✅ No users with multiple settings found")
        
        print(f"\n=== SUMMARY ===")
        print(f"Total Users: {len(users)}")
        print(f"Total UserSettings: {len(all_settings)}")
        print(f"Duplicate Emails: {'YES' if duplicates_found else 'NO'}")
        print(f"Orphaned Settings: {len(orphaned_settings)}")
        print(f"Multiple Settings per User: {'YES' if multiple_settings_found else 'NO'}")

if __name__ == "__main__":
    check_duplicate_users() 