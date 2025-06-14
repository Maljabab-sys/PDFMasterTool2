#!/usr/bin/env python3
"""
Script to create a user with your email address
"""

import os
from api_app import app, db
from config.models import User

def create_user():
    with app.app_context():
        print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        
        # Ensure instance directory exists
        os.makedirs('instance', exist_ok=True)
        print("Instance directory verified")
        
        # Create all tables with new schema
        db.create_all()
        print("Database tables created successfully!")
        
        # Check if your user already exists
        your_user = User.query.filter_by(email='mhanna-aj@hotmail.com').first()
        if not your_user:
            # Create your user
            user = User(
                email='mhanna-aj@hotmail.com',
                first_name='Mohammed',
                last_name='Hanna',
                department='Dental',
                position='Doctor'
            )
            user.set_password('password123')  # You can change this
            
            db.session.add(user)
            db.session.commit()
            print("Your user created successfully!")
            print("Email: mhanna-aj@hotmail.com")
            print("Password: password123")
        else:
            print("Your user already exists!")
            
        # Also ensure test user exists
        test_user = User.query.filter_by(email='test@example.com').first()
        if not test_user:
            user = User(
                email='test@example.com',
                first_name='Test',
                last_name='User',
                department='Dental',
                position='Doctor'
            )
            user.set_password('password123')
            
            db.session.add(user)
            db.session.commit()
            print("Test user also created!")

if __name__ == "__main__":
    create_user() 