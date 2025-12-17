import pool from './database.js';

const createTables = async () => {
  try {
    console.log('Starting database migration...');

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Front Desk', 'Sales', 'Operations')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Users table created');

    // Products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL CHECK (category IN ('Roofing Sheet', 'Tile', 'Accessories')),
        unit VARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        available_quantity INTEGER NOT NULL DEFAULT 0,
        threshold_quantity INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL CHECK (status IN ('Active', 'Alert', 'Out of Stock')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Products table created');

    // Customers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        address TEXT,
        total_orders INTEGER DEFAULT 0,
        total_value DECIMAL(12, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Customers table created');

    // Call logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS call_logs (
        id VARCHAR(50) PRIMARY KEY,
        call_date TIMESTAMP NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        query_type VARCHAR(100) NOT NULL CHECK (query_type IN ('Price Inquiry', 'Product Info', 'Complaint', 'Order Status', 'General')),
        product_interest VARCHAR(255),
        next_action VARCHAR(100) NOT NULL CHECK (next_action IN ('Follow-up', 'Lead Created', 'Order Updated', 'New Order', 'No Action')),
        follow_up_date TIMESTAMP,
        remarks TEXT,
        assigned_to VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL CHECK (status IN ('Open', 'Closed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Call logs table created');

    // Leads table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(50) PRIMARY KEY,
        call_id VARCHAR(50),
        customer_name VARCHAR(255) NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        address TEXT,
        product_interest VARCHAR(255),
        planned_purchase_quantity INTEGER,
        status VARCHAR(100) NOT NULL CHECK (status IN ('New', 'Contacted', 'Quoted', 'Negotiation', 'Won', 'Lost')),
        created_date TIMESTAMP NOT NULL,
        aging_days INTEGER DEFAULT 0,
        aging_bucket VARCHAR(50) CHECK (aging_bucket IN ('Fresh', 'Warm', 'At Risk', 'Critical')),
        last_follow_up TIMESTAMP,
        next_follow_up TIMESTAMP,
        assigned_to VARCHAR(255) NOT NULL,
        estimated_value DECIMAL(12, 2),
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (call_id) REFERENCES call_logs(id) ON DELETE SET NULL
      );
    `);
    console.log('✓ Leads table created');

    // Orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        lead_id VARCHAR(50),
        call_id VARCHAR(50),
        customer_name VARCHAR(255) NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        delivery_address TEXT NOT NULL,
        total_amount DECIMAL(12, 2) NOT NULL,
        status VARCHAR(100) NOT NULL CHECK (status IN ('Order Received', 'In Production', 'Ready for Delivery', 'Out for Delivery', 'Delivered', 'Cancelled')),
        order_date TIMESTAMP NOT NULL,
        expected_delivery_date TIMESTAMP NOT NULL,
        actual_delivery_date TIMESTAMP,
        aging_days INTEGER DEFAULT 0,
        is_delayed BOOLEAN DEFAULT false,
        payment_status VARCHAR(50) NOT NULL CHECK (payment_status IN ('Pending', 'Partial', 'Completed')),
        invoice_number VARCHAR(100),
        assigned_to VARCHAR(255) NOT NULL,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
        FOREIGN KEY (call_id) REFERENCES call_logs(id) ON DELETE SET NULL
      );
    `);
    console.log('✓ Orders table created');

    // Order products table (many-to-many relationship)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_products (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) NOT NULL,
        product_id VARCHAR(50) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit VARCHAR(50) NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
      );
    `);
    console.log('✓ Order products table created');

    // Tasks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(100) NOT NULL CHECK (type IN ('Follow-up', 'Delivery', 'Call Back', 'Meeting')),
        linked_to VARCHAR(50) NOT NULL CHECK (linked_to IN ('Lead', 'Order', 'Call')),
        linked_id VARCHAR(50) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        due_date TIMESTAMP NOT NULL,
        status VARCHAR(50) NOT NULL CHECK (status IN ('Pending', 'Done', 'Overdue')),
        assigned_to VARCHAR(255) NOT NULL,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Tasks table created');

    // Shift notes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shift_notes (
        id VARCHAR(50) PRIMARY KEY,
        created_by VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Shift notes table created');

    // Remark logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS remark_logs (
        id VARCHAR(50) PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('callLog', 'lead', 'order', 'product', 'customer', 'user')),
        entity_id VARCHAR(50) NOT NULL,
        remark TEXT NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Remark logs table created');

    // Create indexes for better query performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_call_logs_mobile ON call_logs(mobile);
      CREATE INDEX IF NOT EXISTS idx_call_logs_status ON call_logs(status);
      CREATE INDEX IF NOT EXISTS idx_leads_mobile ON leads(mobile);
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_orders_mobile ON orders(mobile);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_remark_logs_entity ON remark_logs(entity_type, entity_id);
    `);
    console.log('✓ Indexes created');

    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTables()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default createTables;
