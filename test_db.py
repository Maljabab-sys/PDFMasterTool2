#!/usr/bin/env python3
"""
Test script to create database and add a test user
"""

import os
from api_app import app, db
from config.models import User

def create_test_user():
    with app.app_context():
        # Print database URI
        print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        
        # Ensure instance directory exists
        os.makedirs('instance', exist_ok=True)
        print("Instance directory created/verified")
        
        # Drop all tables and recreate them
        db.drop_all()
        print("Dropped all existing tables")
        
        # Create all tables with new schema
        db.create_all()
        print("Database tables created successfully!")
        
        # Check if test user already exists
        test_user = User.query.filter_by(email='test@example.com').first()
        if not test_user:
            # Create a test user
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
            print("Test user created successfully!")
        else:
            print("Test user already exists!")

if __name__ == "__main__":
    create_test_user() 