#!/usr/bin/env python3
"""
Quick script to add a test user
"""

from api_app import app, db
from config.models import User

def add_test_user():
    with app.app_context():
        print("Adding test user...")
        
        # Test user details
        email = "doctor2@dental.com"
        first_name = "Sarah"
        last_name = "Johnson"
        department = "Dental"
        position = "Orthodontist"
        password = "password123"
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            print(f"❌ User with email {email} already exists!")
            return
        
        # Create new user
        new_user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            department=department,
            position=position,
            profile_image=None,
            clinics='["Main Clinic", "Downtown Branch"]',  # JSON array of clinics
            notifications_enabled=True
        )
        new_user.set_password(password)
        
        # Save to database
        db.session.add(new_user)
        db.session.commit()
        
        print(f"✅ Test user created successfully!")
        print(f"Email: {email}")
        print(f"Name: {first_name} {last_name}")
        print(f"Department: {department}")
        print(f"Position: {position}")
        print(f"Password: {password}")
        
        # Show all users in database
        print("\n📋 All users in database:")
        all_users = User.query.all()
        for user in all_users:
            print(f"  - {user.email} ({user.first_name} {user.last_name}) - {user.position}")

if __name__ == "__main__":
    add_test_user() 