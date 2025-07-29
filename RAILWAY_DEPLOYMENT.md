# Railway.app Free Deployment Guide

## 🚀 Railway.app Deployment (Alternative Free Option)

Railway offers $5 monthly credit which is perfect for small projects like yours.

### Prerequisites
1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

### Deployment Steps

1. **Login to Railway:**
```bash
railway login
```

2. **Initialize Railway project:**
```bash
railway init
```

3. **Deploy your application:**
```bash
railway up
```

4. **Set environment variables:**
```bash
railway variables set FLASK_ENV=production
railway variables set SESSION_SECRET=your-super-secret-key-here
```

5. **Add PostgreSQL database:**
```bash
railway add
# Select PostgreSQL from the menu
```

6. **Get your deployment URL:**
```bash
railway status
```

### Railway Configuration

Your `railway.json` file is already configured:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "gunicorn --bind 0.0.0.0:$PORT app:app",
    "healthcheckPath": "/api/auth/verify",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Free Tier Limits
- $5 monthly credit
- Shared infrastructure
- Automatic deployments
- PostgreSQL database included

### Benefits
- Very easy deployment
- Automatic HTTPS
- Custom domains
- Real-time logs
- Automatic scaling

### Cost Estimation
- Small Flask app: ~$2-3/month
- PostgreSQL database: ~$1-2/month
- **Total: ~$3-5/month** (within free tier)

## 🎯 Recommendation
Railway is excellent for quick deployments and development. For production use, consider Render.com for the 750 free hours.