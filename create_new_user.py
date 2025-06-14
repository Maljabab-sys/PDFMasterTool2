#!/usr/bin/env python3
"""
Script to create a new user in the database
"""

from api_app import app, db
from config.models import User

def create_new_user():
    with app.app_context():
        print("Creating a new user...")
        
        # Get user details
        email = input("Enter email address: ")
        first_name = input("Enter first name: ")
        last_name = input("Enter last name: ")
        department = input("Enter department (default: Dental): ") or "Dental"
        position = input("Enter position (default: Doctor): ") or "Doctor"
        password = input("Enter password (default: password123): ") or "password123"
        
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
            clinics='[]',  # Empty JSON array
            notifications_enabled=True
        )
        new_user.set_password(password)
        
        # Save to database
        db.session.add(new_user)
        db.session.commit()
        
        print(f"✅ User created successfully!")
        print(f"Email: {email}")
        print(f"Name: {first_name} {last_name}")
        print(f"Department: {department}")
        print(f"Position: {position}")
        print(f"Password: {password}")
        
        # Show all users in database
        print("\n📋 All users in database:")
        all_users = User.query.all()
        for user in all_users:
            print(f"  - {user.email} ({user.first_name} {user.last_name})")

if __name__ == "__main__":
    create_new_user() 