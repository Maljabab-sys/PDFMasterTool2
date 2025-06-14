#!/usr/bin/env python3
"""
Quick setup script to initialize database and create user
"""

import os
import sys
from api_app import app, db
from config.models import User

def setup_database():
    with app.app_context():
        print("Setting up database...")
        
        # Create all tables
        db.create_all()
        print("✅ Database tables created successfully!")
        
        # Check if your user exists
        email = 'mhanna-aj@hotmail.com'
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Create your user
            user = User(
                email=email,
                first_name='Mohammed',
                last_name='Hanna',
                department='Dental',
                position='Doctor',
                profile_image=None,
                clinics='[]',  # Empty JSON array
                notifications_enabled=True
            )
            user.set_password('password123')  # Use a simple password for testing
            
            db.session.add(user)
            db.session.commit()
            print(f"✅ User created: {email}")
        else:
            print(f"✅ User already exists: {email}")
        
        # Also create test user for backup
        test_email = 'test@example.com'
        test_user = User.query.filter_by(email=test_email).first()
        
        if not test_user:
            test_user = User(
                email=test_email,
                first_name='Test',
                last_name='User',
                department='Dental',
                position='Doctor',
                profile_image=None,
                clinics='[]',
                notifications_enabled=True
            )
            test_user.set_password('password123')
            
            db.session.add(test_user)
            db.session.commit()
            print(f"✅ Test user created: {test_email}")
        else:
            print(f"✅ Test user already exists: {test_email}")
        
        print("\n🎉 Setup completed successfully!")
        print(f"You can now login with:")
        print(f"  Email: {email}")
        print(f"  Password: password123")
        print(f"\nOr use test account:")
        print(f"  Email: {test_email}")
        print(f"  Password: password123")

if __name__ == '__main__':
    setup_database() 