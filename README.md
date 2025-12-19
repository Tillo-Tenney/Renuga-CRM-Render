# Renuga Roofings CRM

A full-stack CRM system for Renuga Roofings built with React, TypeScript, Node.js, Express, and PostgreSQL.

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Vite + Shadcn UI + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT-based authentication
- **Deployment**: Render Platform, AWS EC2 Ubuntu

## 📋 Features

- **Call Log Management**: Track customer calls and inquiries
- **Lead Management**: Manage leads with aging tracking and follow-ups
- **Order Management**: Handle orders with product tracking and delivery status
- **Product Catalog**: Manage roofing products inventory
- **Customer Database**: Store customer information and history
- **Task Management**: Track follow-ups and deliveries
- **Shift Notes**: Communicate between shifts
- **User Management**: Role-based access control (Admin, Sales, Front Desk, Operations)
- **Dashboard Analytics**: Real-time statistics and insights

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Local Development Setup

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd renuga-crm
```

2. **Install Frontend Dependencies**
```bash
npm install
```

3. **Install Backend Dependencies**
```bash
cd server
npm install
cd ..
```

4. **Setup Database**

Create a PostgreSQL database:
```bash
createdb renuga_crm
```

Configure environment variables:
```bash
# Copy backend environment template
cp server/.env.example server/.env

# Edit server/.env with your database credentials
# DATABASE_URL=postgresql://user:password@localhost:5432/renuga_crm
```

Run database migrations and seed data:
```bash
cd server
npm run db:migrate
npm run db:seed
cd ..
```

5. **Configure Frontend Environment**
```bash
cp .env.example .env.local
# Edit .env.local if needed (defaults to http://localhost:3001)
```

6. **Start Development Servers**

Terminal 1 - Backend:
```bash
cd server
npm run dev
```

Terminal 2 - Frontend:
```bash
npm run dev
```

7. **Access the Application**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

### Default Users

After seeding, use these credentials to login:

- **Admin**: admin@renuga.com / admin123
- **Front Desk**: priya@renuga.com / password123
- **Sales**: ravi@renuga.com / password123
- **Operations**: muthu@renuga.com / password123

## 📦 Deployment

### Deployment to AWS EC2 Ubuntu (Recommended for Production)

For deploying to AWS EC2 instances running Ubuntu:

**Quick Start**:
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Clone and run automated setup
git clone https://github.com/Tillo-Tenney/Renuga-CRM-Render.git
cd Renuga-CRM-Render
chmod +x ec2-setup.sh
sudo ./ec2-setup.sh
```

**Documentation**:
- 📘 [EC2 Quick Start Guide](./QUICKSTART_EC2.md) - Get up and running in 10 minutes
- 📚 [Full EC2 Deployment Guide](./AWS_EC2_DEPLOYMENT.md) - Complete reference with troubleshooting

**What's Included**:
- Automated setup script (`ec2-setup.sh`)
- Manual deployment helper (`ec2-manual-helper.sh`)
- Nginx configuration templates (`nginx/`)
- Systemd service files (`systemd/`)
- Backup and maintenance scripts

### CI/CD with GitHub Actions (Automated Deployment)

Set up continuous integration and deployment for automatic deployments to EC2:

**Quick Start (15 minutes)**:
```bash
# Generate deploy key
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy -N ""

# Add public key to EC2
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# Configure GitHub Secrets (in repository settings):
# - EC2_SSH_PRIVATE_KEY: Contents of ~/.ssh/github_deploy
# - EC2_HOST: Your EC2 IP address
# - EC2_USER: ubuntu
# - VITE_API_URL: http://YOUR_EC2_IP:3001
```

**CI/CD Documentation**:
- 🚀 [CI/CD Quick Start](./CICD_QUICKSTART.md) - Set up automated deployment in 15 minutes
- 📖 [Complete CI/CD Guide](./GITHUB_ACTIONS_CICD_GUIDE.md) - Full guide with best practices
- 🔐 [GitHub Secrets Guide](./GITHUB_SECRETS_GUIDE.md) - Configure secrets properly
- ✅ [Deployment Checklist](./CICD_DEPLOYMENT_CHECKLIST.md) - Pre and post-deployment tasks

**Features**:
- ✨ Automated build and test on every push
- 🚀 Automatic deployment to EC2
- 🔄 Zero-downtime deployments with automatic backups
- 🔙 One-click rollback capability
- ✅ Health checks and verification
- 📊 Deployment status notifications

**Workflow**:
```bash
# Push to main branch
git push origin main

# GitHub Actions automatically:
# 1. Builds frontend and backend
# 2. Runs tests and linting
# 3. Creates deployment package
# 4. Deploys to EC2 via SSH
# 5. Creates backup before deployment
# 6. Restarts services
# 7. Verifies deployment health
```

### Deployment to Render Platform

For deploying to Render cloud platform:

### Using render.yaml (Recommended)

1. **Push your code to GitHub**
```bash
git push origin main
```

2. **Create New Blueprint on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and create:
     - PostgreSQL database
     - Backend API web service
     - Frontend static site

3. **Environment Variables**

The `render.yaml` file configures most environment variables automatically. You may need to verify:
   - `JWT_SECRET` (auto-generated by Render)
   - `DATABASE_URL` (auto-linked from database)
   - `FRONTEND_URL` (auto-set from frontend service)
   - `VITE_API_URL` (auto-set from backend service)

4. **Initialize Database**

After deployment, run migrations from Render Shell:
```bash
# In backend service shell
npm run db:migrate
npm run db:seed
```

### Manual Deployment

#### Backend API Service

1. Create a new **Web Service**
2. Configure:
   - **Build Command**: `cd server && npm install && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     DATABASE_URL=<your-postgres-url>
     JWT_SECRET=<generate-secure-secret>
     JWT_EXPIRES_IN=7d
     FRONTEND_URL=<your-frontend-url>
     ```

#### Frontend Static Site

1. Create a new **Static Site**
2. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `./dist`
   - **Environment Variables**:
     ```
     VITE_API_URL=<your-backend-api-url>
     ```

#### Database

1. Create a new **PostgreSQL** database
2. Link it to your backend service
3. Run migrations using Render Shell

## 🛠️ Development

### Project Structure

```
renuga-crm/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── contexts/          # React contexts (Auth, CRM)
│   ├── pages/             # Page components
│   ├── services/          # API client services
│   ├── utils/             # Utility functions
│   └── data/              # TypeScript interfaces
├── server/                # Backend source
│   ├── src/
│   │   ├── config/        # Database config & migrations
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   └── index.ts       # Server entry point
│   └── package.json
├── public/                # Static assets
└── package.json           # Frontend dependencies
```

### Available Scripts

**Frontend**:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

**Backend**:
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Run production server
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed initial data

## 📚 API Documentation

### Authentication

- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/validate` - Validate JWT token
- `POST /api/auth/logout` - Logout

### Resources

All resource endpoints require authentication (Bearer token in Authorization header).

- **Call Logs**: `/api/call-logs`
- **Leads**: `/api/leads`
- **Orders**: `/api/orders`
- **Products**: `/api/products`
- **Tasks**: `/api/tasks`
- **Customers**: `/api/customers`
- **Users**: `/api/users`
- **Shift Notes**: `/api/shift-notes`
- **Remark Logs**: `/api/remark-logs`

Each resource supports standard CRUD operations:
- `GET /api/{resource}` - List all
- `GET /api/{resource}/:id` - Get by ID
- `POST /api/{resource}` - Create new
- `PUT /api/{resource}/:id` - Update
- `DELETE /api/{resource}/:id` - Delete

See [server/README.md](server/README.md) for detailed API documentation.

## 🔧 Technologies Used

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- TanStack Query
- Shadcn UI Components
- Tailwind CSS
- Lucide Icons

### Backend
- Node.js
- Express
- TypeScript
- PostgreSQL
- JWT Authentication
- Bcrypt for password hashing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 🆘 Support

For issues or questions:
1. Check existing GitHub Issues
2. Create a new issue with detailed description
3. Contact the development team

## 🔐 Security

- Never commit `.env` files or sensitive credentials
- Use strong JWT secrets in production
- Enable SSL/TLS for database connections in production
- Regularly update dependencies for security patches

---

Built with ❤️ for Renuga Roofings
