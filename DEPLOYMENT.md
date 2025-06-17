# Dental AI App Deployment Guide

This guide covers deployment options for your dental AI application.

## 🚀 Quick Start (Recommended: Render.com)

### 1. Render.com Deployment (Easiest)

1. **Fork/Push your code to GitHub**
2. **Connect to Render.com:**
   - Sign up at [render.com](https://render.com)
   - Connect your GitHub account
   - Create a new Blueprint and select this repository

3. **Environment Variables:**
   ```
   FLASK_ENV=production
   SESSION_SECRET=your-super-secret-key-here
   DATABASE_URL=(will be provided by Render for PostgreSQL)
   ```

4. **Deploy with render.yaml:**
   - Your `render.yaml` file is already configured
   - Render will automatically detect and deploy both services

### 2. Railway Deployment

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy:**
   ```bash
   railway login
   railway init
   railway up
   ```

### 3. Heroku Deployment

1. **Install Heroku CLI**
2. **Deploy:**
   ```bash
   heroku create your-dental-ai-app
   heroku addons:create heroku-postgresql:hobby-dev
   git push heroku main
   ```

## 🐳 Docker Deployment

### Local Docker Development

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Services will be available at:**
   - Backend: http://localhost:5000
   - Frontend: http://localhost:3000

### Production Docker Deployment

1. **Build production images:**
   ```bash
   docker build -t dental-ai-backend .
   docker build -t dental-ai-frontend ./frontend
   ```

2. **Deploy to your server or cloud provider**

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Backend (.env)
FLASK_ENV=production
DATABASE_URL=your-database-url
SESSION_SECRET=your-super-secret-key
PORT=5000

# Frontend (.env)
REACT_APP_API_URL=https://your-backend-url.com
```

### Database Migration

For PostgreSQL deployment:

1. **Update requirements.txt:**
   ```
   psycopg2-binary==2.9.7
   ```

2. **Update database URL:**
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

## 📋 Pre-Deployment Checklist

- [ ] Update `DATABASE_URL` for production database
- [ ] Set strong `SESSION_SECRET`
- [ ] Configure CORS origins for production
- [ ] Upload AI models to persistent storage
- [ ] Set up file upload storage (AWS S3, etc.)
- [ ] Configure domain/SSL certificate
- [ ] Set up monitoring and logging

## 🔐 Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files
   - Use platform-specific secret management

2. **Database:**
   - Use PostgreSQL in production
   - Regular backups
   - Connection pooling

3. **File Storage:**
   - Use cloud storage (AWS S3, Google Cloud Storage)
   - Implement file type validation
   - Scan uploaded files for malware

## 🚨 Common Issues

### 1. AI Model Loading
- Ensure models are in the correct path
- Check file permissions
- Consider using cloud storage for models

### 2. Database Connection
- Verify DATABASE_URL format
- Check network connectivity
- Monitor connection pool

### 3. File Uploads
- Configure proper file permissions
- Set up persistent storage
- Monitor disk usage

## 📊 Monitoring

### Health Check Endpoints
- `/api/auth/verify` - Authentication check
- `/api/ai/model-status` - AI model status

### Logging
- Configure structured logging
- Monitor error rates
- Set up alerts

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

## 🆘 Troubleshooting

### Check Application Logs
```bash
# Render
render logs

# Railway
railway logs

# Heroku
heroku logs --tail
```

### Database Issues
```bash
# Check database connection
python -c "from config.database import db; print('DB Connected')"

# Initialize database
python -c "from config.database import db; from config.models import *; db.create_all()"
```

## 📞 Support

If you encounter issues:
1. Check the logs first
2. Verify environment variables
3. Test database connectivity
4. Check AI model paths

---

Choose the deployment method that best fits your needs and technical expertise. Render.com is recommended for beginners, while Docker gives you more control for advanced users. 