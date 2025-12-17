# Deployment Guide - Renuga CRM

## Overview

This guide walks you through deploying the Renuga CRM application to Render platform. The application consists of:
- **Frontend**: React static site
- **Backend**: Node.js Express API
- **Database**: PostgreSQL

## Prerequisites

- GitHub account with repository access
- [Render account](https://render.com) (free tier is sufficient)
- Git installed locally

## Local Testing (Optional but Recommended)

Before deploying to production, test the full stack locally:

### 1. Setup Local Database

```bash
# Install PostgreSQL if not already installed
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql
# Windows: Download from postgresql.org

# Create database
createdb renuga_crm

# Or using psql
psql -U postgres
CREATE DATABASE renuga_crm;
\q
```

### 2. Configure Backend

```bash
cd server
cp .env.example .env

# Edit .env with your settings:
# DATABASE_URL=postgresql://your_user:your_password@localhost:5432/renuga_crm
# JWT_SECRET=your-secret-key-here
# FRONTEND_URL=http://localhost:8080

# Install dependencies
npm install

# Run migrations
npm run build
npm run db:migrate
or
npx tsx src/config/migrate.ts
or
npx tsx run-migration.ts #Run with output

# Seed data
npm run db:seed
or
tsx src/config/seed.ts
or
npx tsx run-seed.ts #Run with output

# Start backend
npm run dev
```

Backend should be running on http://localhost:3001

### 3. Configure Frontend

```bash
# In project root
cp .env.example .env.local

# Install dependencies
npm install

# Start frontend
npm run dev
```

Frontend should be running on http://localhost:8080

### 4. Test Login

Open http://localhost:8080 and login with:
- **Email**: admin@renuga.com
- **Password**: admin123

## Production Deployment on Render

### Method 1: Using render.yaml (Recommended)

This method automatically creates all required services from the configuration file.

#### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

#### Step 2: Create Blueprint on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub account if not already connected
4. Select the **renuga-crm** repository
5. Render will detect `render.yaml` and show you the services to be created:
   - PostgreSQL database: `renuga-crm-db`
   - Backend API: `renuga-crm-api`
   - Frontend: `renuga-crm-frontend`
6. Review the services and click **"Apply"**

#### Step 3: Wait for Deployment

Render will:
1. Create the PostgreSQL database
2. Deploy the backend API (this takes 5-10 minutes)
3. Deploy the frontend static site (this takes 2-5 minutes)

#### Step 4: Initialize Database

Once the backend is deployed:

1. Go to your **renuga-crm-api** service in Render
2. Click **"Shell"** tab
3. Run migrations and seed:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

#### Step 5: Access Your Application

1. Go to your **renuga-crm-frontend** service
2. Copy the URL (format: `https://renuga-crm-frontend.onrender.com`)
3. Open in browser
4. Login with: admin@renuga.com / admin123

### Method 2: Manual Setup

If you prefer to set up services manually or need more control:

#### Step 1: Create PostgreSQL Database

1. In Render Dashboard, click **"New"** → **"PostgreSQL"**
2. Configure:
   - **Name**: renuga-crm-db
   - **Database**: renuga_crm
   - **User**: renuga_user (or your preferred name)
   - **Region**: Choose closest to your users
   - **Plan**: Free
3. Click **"Create Database"**
4. Wait for creation and note the **Internal Database URL**

#### Step 2: Deploy Backend API

1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: renuga-crm-api
   - **Region**: Same as database
   - **Branch**: main
   - **Root Directory**: Leave empty
   - **Runtime**: Node
   - **Build Command**: `cd server && npm install && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free
4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<paste-internal-database-url-from-step-1>
   JWT_SECRET=<generate-a-random-string-32-chars>
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=<will-add-after-frontend-deployment>
   ```
5. Click **"Create Web Service"**
6. Wait for deployment to complete

#### Step 3: Initialize Database

1. Once backend is deployed, open its **Shell** tab
2. Run:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

#### Step 4: Deploy Frontend

1. Click **"New"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: renuga-crm-frontend
   - **Region**: Same as backend
   - **Branch**: main
   - **Root Directory**: Leave empty
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variable:
   ```
   VITE_API_URL=<your-backend-url>
   ```
   Get backend URL from renuga-crm-api service (format: `https://renuga-crm-api.onrender.com`)
5. Configure **Rewrite Rule** for SPA routing:
   - Go to **"Redirects/Rewrites"** tab
   - Add rewrite: `/*` → `/index.html` (200)
6. Click **"Create Static Site"**

#### Step 5: Update Backend CORS

1. Go back to **renuga-crm-api** service
2. Update the `FRONTEND_URL` environment variable with your frontend URL
3. Service will auto-redeploy

#### Step 6: Test Your Application

1. Open your frontend URL
2. Login with default credentials
3. Verify all features work

## Post-Deployment

### Update JWT Secret

For production security:

```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update JWT_SECRET in backend environment variables
```

### Monitor Application

1. Check **Logs** tab in each service for errors
2. Set up **Alerts** for service failures
3. Monitor database usage in PostgreSQL dashboard

### Custom Domain (Optional)

1. Go to frontend service settings
2. Click **"Custom Domains"**
3. Add your domain
4. Follow DNS configuration instructions

## Troubleshooting

### Backend Fails to Start

**Issue**: "Cannot connect to database"
- **Solution**: Verify DATABASE_URL is correct
- Check database is running
- Ensure internal database URL is used (not external)

**Issue**: "Module not found"
- **Solution**: Check build command includes `npm install`
- Verify all dependencies are in package.json

### Frontend Can't Connect to API

**Issue**: CORS errors in browser console
- **Solution**: Verify FRONTEND_URL in backend matches your frontend URL
- Check backend CORS configuration allows your frontend domain

**Issue**: 404 errors on API calls
- **Solution**: Verify VITE_API_URL in frontend points to backend URL
- Ensure backend is running and healthy

### Database Migration Fails

**Issue**: "relation already exists"
- **Solution**: Database already migrated, ignore or drop and recreate

**Issue**: "permission denied"
- **Solution**: Check database credentials
- Verify DATABASE_URL includes correct username/password

## Updating the Application

### Code Updates

```bash
# Make changes locally
git add .
git commit -m "Your update message"
git push origin main

# Render auto-deploys on push
```

### Database Migrations

If you add new migrations:

```bash
# In backend shell on Render
npm run db:migrate
```

### Environment Variables

1. Update in Render dashboard
2. Service will auto-redeploy

## Backup and Restore

### Backup Database

```bash
# From Render dashboard, go to your PostgreSQL service
# Click "Backup" tab
# Manual backups or configure automatic backups
```

### Restore Database

```bash
# Download backup from Render
# Use pg_restore to restore locally or to another database
```

## Scaling

### Free Tier Limitations

- Backend spins down after 15 minutes of inactivity
- First request after spin-down takes 30+ seconds
- Database limited to 1GB storage

### Upgrade to Paid Plans

For production use:
- **Starter Plan** ($7/month): No spin-down, better performance
- **Standard Plan** ($25/month): More resources, zero-downtime deploys
- **Database**: Upgrade for more storage and connections

## Security Checklist

- [ ] Change default JWT_SECRET to a secure random string
- [ ] Update default user passwords
- [ ] Enable SSL/TLS for database connections (enabled by default on Render)
- [ ] Set up alerts for failed logins
- [ ] Regular backup schedule
- [ ] Monitor access logs
- [ ] Keep dependencies updated

## Support

- **Documentation**: See README.md and server/README.md
- **Issues**: Open GitHub issue
- **Render Support**: https://render.com/docs
- **PostgreSQL Help**: https://www.postgresql.org/docs/

---

**Congratulations!** Your Renuga CRM is now live in production! 🎉
