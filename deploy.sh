#!/bin/bash

echo "🚀 Dental AI App - Free Deployment Guide"
echo "========================================"

echo ""
echo "📋 Available Free Deployment Options:"
echo "1. Render.com (Recommended) - 750 hours/month free"
echo "2. Railway.app - $5 credit monthly"
echo "3. Vercel + Railway - Frontend + Backend separation"
echo ""

echo "🎯 Recommended: Render.com Deployment"
echo ""

echo "📝 Steps to deploy on Render.com:"
echo "1. Go to https://render.com"
echo "2. Sign up with your GitHub account"
echo "3. Click 'New Blueprint Instance'"
echo "4. Connect your GitHub repository: https://github.com/Maljabab-sys/PDFMasterTool2"
echo "5. Render will automatically detect your render.yaml configuration"
echo "6. Click 'Apply' to deploy"
echo ""

echo "🔧 Your render.yaml is already configured for:"
echo "   - Backend service (Flask API)"
echo "   - Frontend service (React app)"
echo "   - PostgreSQL database"
echo ""

echo "⚙️ Environment variables will be set automatically:"
echo "   - FLASK_ENV=production"
echo "   - DATABASE_URL (provided by Render)"
echo "   - SESSION_SECRET (auto-generated)"
echo ""

echo "🌐 After deployment, your app will be available at:"
echo "   - Backend: https://dental-ai-backend.onrender.com"
echo "   - Frontend: https://dental-ai-frontend.onrender.com"
echo ""

echo "📊 Free tier limits:"
echo "   - 750 hours/month (enough for 24/7 deployment)"
echo "   - 512MB RAM per service"
echo "   - Shared CPU"
echo "   - PostgreSQL database included"
echo ""

echo "✅ Your app is ready for deployment!"
echo "   Just follow the steps above to deploy on Render.com"