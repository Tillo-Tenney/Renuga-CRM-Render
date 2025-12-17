# Renuga CRM Server

Backend API for Renuga Roofings CRM system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Set up the database:
```bash
# Run migrations to create tables
npm run db:migrate

# Seed initial data
npm run db:seed
```

4. Start the server:
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/validate` - Validate JWT token
- `POST /api/auth/logout` - Logout (client-side token removal)

### Call Logs
- `GET /api/call-logs` - Get all call logs
- `GET /api/call-logs/:id` - Get call log by ID
- `POST /api/call-logs` - Create new call log
- `PUT /api/call-logs/:id` - Update call log
- `DELETE /api/call-logs/:id` - Delete call log

### Leads
- `GET /api/leads` - Get all leads
- `GET /api/leads/:id` - Get lead by ID
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Orders
- `GET /api/orders` - Get all orders with products
- `GET /api/orders/:id` - Get order by ID with products
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Other Resources
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `GET /api/users` - Get all users
- `GET /api/shift-notes` - Get all shift notes
- `POST /api/shift-notes` - Create shift note
- `PUT /api/shift-notes/:id` - Update shift note
- `GET /api/remark-logs` - Get remark logs (query params: entityType, entityId)
- `POST /api/remark-logs` - Create remark log

## Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `JWT_EXPIRES_IN` - JWT token expiration time (default: 7d)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:8080)

## Default Users

After seeding, these users are available:

- Admin: admin@renuga.com / admin123
- Front Desk: priya@renuga.com / password123
- Sales: ravi@renuga.com / password123
- Operations: muthu@renuga.com / password123

## Database

Using PostgreSQL with the following tables:
- users
- products
- customers
- call_logs
- leads
- orders
- order_products
- tasks
- shift_notes
- remark_logs

## Production Deployment

For Render:

1. Create a new Web Service
2. Connect your repository
3. Set build command: `cd server && npm install && npm run build`
4. Set start command: `cd server && npm start`
5. Add environment variables in Render dashboard
6. Create a PostgreSQL database and link it
