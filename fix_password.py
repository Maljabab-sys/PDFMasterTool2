#!/usr/bin/env python3
"""
Script to fix password issue
"""

from api_app import app, db
from config.models import User

def fix_password():
    with app.app_context():
        print("Fixing password...")
        
        # Get your user
        user = User.query.filter_by(email='mhanna-aj@hotmail.com').first()
        
        if user:
            # Reset password
            user.set_password('password123')
            db.session.commit()
            print(f"✅ Password reset for: {user.email}")
            
            # Test password
            if user.check_password('password123'):
                print("✅ Password verification successful!")
            else:
                print("❌ Password verification failed!")
        else:
            print("❌ User not found!")
            
        # Also fix test user
        test_user = User.query.filter_by(email='test@example.com').first()
        if test_user:
            test_user.set_password('password123')
            db.session.commit()
            print(f"✅ Test user password reset")

if __name__ == '__main__':
    fix_password() 