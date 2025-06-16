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

def check_session_conflicts():
    """Check for session and authentication conflicts"""
    with app.app_context():
        print("=== CHECKING SESSION AND AUTH CONFLICTS ===")
        
        # Check all users
        print("\n1. ALL USERS IN DATABASE:")
        users = User.query.all()
        
        for user in users:
            print(f"\nUser ID: {user.id}")
            print(f"Email: {user.email}")
            print(f"Name: {user.first_name} {user.last_name}")
            print(f"Created: {user.created_at}")
            print(f"Last Login: {user.last_login}")
            
            # Check settings
            settings = UserSettings.query.filter_by(user_id=user.id).first()
            if settings:
                print(f"✅ Has UserSettings:")
                print(f"   - Full Name: '{settings.full_name}'")
                print(f"   - Email: '{settings.email}'")
                print(f"   - Profile Image: {settings.profile_image}")
                print(f"   - Updated: {settings.updated_at}")
                
                # Check if profile image file exists
                if settings.profile_image:
                    if os.path.exists(settings.profile_image):
                        print(f"   - ✅ Profile image file EXISTS")
                    else:
                        print(f"   - ❌ Profile image file MISSING")
            else:
                print(f"❌ No UserSettings found")
        
        # Check uploads directory
        print(f"\n2. CHECKING UPLOADS DIRECTORY:")
        uploads_dir = "uploads"
        profiles_dir = os.path.join(uploads_dir, "profiles")
        
        if os.path.exists(uploads_dir):
            print(f"✅ Uploads directory exists: {uploads_dir}")
            files = os.listdir(uploads_dir)
            print(f"   Files in uploads: {len(files)}")
            for file in files[:10]:  # Show first 10 files
                print(f"   - {file}")
            if len(files) > 10:
                print(f"   ... and {len(files) - 10} more files")
        else:
            print(f"❌ Uploads directory missing: {uploads_dir}")
        
        if os.path.exists(profiles_dir):
            print(f"✅ Profiles directory exists: {profiles_dir}")
            profile_files = os.listdir(profiles_dir)
            print(f"   Profile images: {len(profile_files)}")
            for file in profile_files:
                file_path = os.path.join(profiles_dir, file)
                file_size = os.path.getsize(file_path)
                print(f"   - {file} ({file_size} bytes)")
        else:
            print(f"❌ Profiles directory missing: {profiles_dir}")

if __name__ == "__main__":
    check_session_conflicts() 