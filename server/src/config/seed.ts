import pool from './database.js';
import bcrypt from 'bcrypt';

const seedData = async () => {
  try {
    console.log('Starting database seeding...');

    // Check if data already exists
    const { rows: existingUsers } = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers[0].count) > 0) {
      console.log('Database already seeded. Skipping...');
      return;
    }

    // Seed Users
    const users = [
      { id: 'U001', name: 'Priya S.', email: 'priya@renuga.com', password: 'password123', role: 'Front Desk' },
      { id: 'U002', name: 'Ravi K.', email: 'ravi@renuga.com', password: 'password123', role: 'Sales' },
      { id: 'U003', name: 'Muthu R.', email: 'muthu@renuga.com', password: 'password123', role: 'Operations' },
      { id: 'U004', name: 'Admin', email: 'admin@renuga.com', password: 'admin123', role: 'Admin' },
    ];

    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      await pool.query(
        'INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
        [user.id, user.name, user.email, passwordHash, user.role, true]
      );
    }
    console.log('✓ Users seeded');

    // Seed Products
    const products = [
      { id: 'P001', name: 'Color Coated Roofing Sheet', category: 'Roofing Sheet', unit: 'Sq.ft', price: 45, availableQuantity: 5000, thresholdQuantity: 2500, status: 'Active' },
      { id: 'P002', name: 'GI Plain Sheet', category: 'Roofing Sheet', unit: 'Sq.ft', price: 38, availableQuantity: 2000, thresholdQuantity: 2000, status: 'Alert' },
      { id: 'P003', name: 'Polycarbonate Sheet', category: 'Roofing Sheet', unit: 'Sq.ft', price: 85, availableQuantity: 3000, thresholdQuantity: 1500, status: 'Active' },
      { id: 'P004', name: 'Clay Roof Tile', category: 'Tile', unit: 'Piece', price: 12, availableQuantity: 800, thresholdQuantity: 1000, status: 'Alert' },
      { id: 'P005', name: 'Cement Roof Tile', category: 'Tile', unit: 'Piece', price: 18, availableQuantity: 2500, thresholdQuantity: 1000, status: 'Active' },
      { id: 'P006', name: 'Ridge Cap', category: 'Accessories', unit: 'Piece', price: 150, availableQuantity: 300, thresholdQuantity: 200, status: 'Active' },
      { id: 'P007', name: 'Self Drilling Screw', category: 'Accessories', unit: 'Kg', price: 280, availableQuantity: 50, thresholdQuantity: 100, status: 'Alert' },
      { id: 'P008', name: 'Turbo Ventilator', category: 'Accessories', unit: 'Piece', price: 1200, availableQuantity: 25, thresholdQuantity: 20, status: 'Active' },
    ];

    for (const product of products) {
      await pool.query(
        'INSERT INTO products (id, name, category, unit, price, available_quantity, threshold_quantity, status, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [product.id, product.name, product.category, product.unit, product.price, product.availableQuantity, product.thresholdQuantity, product.status, true]
      );
    }
    console.log('✓ Products seeded');

    // Seed Customers
    const customers = [
      { id: 'C001', name: 'Kumar', mobile: '9876543210', email: 'kumar@email.com', address: '45, Anna Nagar, Trichy', totalOrders: 2, totalValue: 85000 },
      { id: 'C002', name: 'Raja', mobile: '9876543211', email: 'raja@email.com', address: '78, KK Nagar, Trichy', totalOrders: 1, totalValue: 45000 },
      { id: 'C003', name: 'Senthil Builders', mobile: '9876543212', email: 'senthil@builders.com', address: '12, Thillai Nagar, Trichy', totalOrders: 5, totalValue: 320000 },
      { id: 'C004', name: 'Lakshmi Constructions', mobile: '9876543213', address: '99, Woraiyur, Trichy', totalOrders: 3, totalValue: 175000 },
      { id: 'C005', name: 'Murugan', mobile: '9876543214', address: '33, Srirangam, Trichy', totalOrders: 1, totalValue: 28000 },
    ];

    for (const customer of customers) {
      await pool.query(
        'INSERT INTO customers (id, name, mobile, email, address, total_orders, total_value) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [customer.id, customer.name, customer.mobile, customer.email || null, customer.address, customer.totalOrders, customer.totalValue]
      );
    }
    console.log('✓ Customers seeded');

    // Seed Call Logs
    const callLogs = [
      { id: 'CALL-001', callDate: '2024-12-11T09:30:00', customerName: 'Kumar', mobile: '9876543210', queryType: 'Price Inquiry', productInterest: 'Color Coated Roofing Sheet', nextAction: 'Lead Created', remarks: 'Interested in 500 sqft for new house construction', assignedTo: 'Priya S.', status: 'Closed' },
      { id: 'CALL-002', callDate: '2024-12-12T10:15:00', customerName: 'Raja', mobile: '9876543211', queryType: 'Order Status', productInterest: 'GI Plain Sheet', nextAction: 'Order Updated', remarks: 'Checking delivery status for existing order', assignedTo: 'Priya S.', status: 'Closed' },
      { id: 'CALL-003', callDate: '2024-12-14T11:00:00', customerName: 'Senthil Builders', mobile: '9876543212', queryType: 'Price Inquiry', productInterest: 'Polycarbonate Sheet', nextAction: 'Follow-up', followUpDate: '2024-12-16T14:00:00', remarks: 'Needs quote for large project - 2000 sqft', assignedTo: 'Ravi K.', status: 'Open' },
      { id: 'CALL-004', callDate: '2024-12-15T09:00:00', customerName: 'Lakshmi Constructions', mobile: '9876543213', queryType: 'Product Info', productInterest: 'Turbo Ventilator', nextAction: 'Follow-up', followUpDate: '2024-12-15T16:00:00', remarks: 'Inquiring about bulk purchase for new project', assignedTo: 'Ravi K.', status: 'Open' },
      { id: 'CALL-005', callDate: '2024-12-15T10:30:00', customerName: 'Murugan', mobile: '9876543214', queryType: 'Complaint', productInterest: 'Ridge Cap', nextAction: 'Follow-up', followUpDate: '2024-12-15T15:00:00', remarks: 'Minor issue with last delivery - missing 5 pieces', assignedTo: 'Muthu R.', status: 'Open' },
    ];

    for (const callLog of callLogs) {
      await pool.query(
        'INSERT INTO call_logs (id, call_date, customer_name, mobile, query_type, product_interest, next_action, follow_up_date, remarks, assigned_to, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [callLog.id, callLog.callDate, callLog.customerName, callLog.mobile, callLog.queryType, callLog.productInterest, callLog.nextAction, callLog.followUpDate || null, callLog.remarks, callLog.assignedTo, callLog.status]
      );
    }
    console.log('✓ Call logs seeded');

    // Seed Leads
    const leads = [
      { id: 'L-101', callId: 'CALL-001', customerName: 'Kumar', mobile: '9876543210', email: 'kumar@email.com', address: '45, Anna Nagar, Trichy', productInterest: 'Color Coated Roofing Sheet', plannedPurchaseQuantity: 500, status: 'Negotiation', createdDate: '2024-12-11', agingDays: 4, agingBucket: 'Warm', lastFollowUp: '2024-12-14', nextFollowUp: '2024-12-16', assignedTo: 'Ravi K.', estimatedValue: 25000, remarks: 'Price negotiation in progress' },
      { id: 'L-102', callId: 'CALL-003', customerName: 'Senthil Builders', mobile: '9876543212', email: 'senthil@builders.com', address: '12, Thillai Nagar, Trichy', productInterest: 'Polycarbonate Sheet', plannedPurchaseQuantity: 2000, status: 'Quoted', createdDate: '2024-12-14', agingDays: 1, agingBucket: 'Fresh', lastFollowUp: '2024-12-14', nextFollowUp: '2024-12-16', assignedTo: 'Ravi K.', estimatedValue: 170000, remarks: 'Quote sent for 2000 sqft' },
      { id: 'L-103', callId: 'CALL-004', customerName: 'Lakshmi Constructions', mobile: '9876543213', address: '99, Woraiyur, Trichy', productInterest: 'Turbo Ventilator', plannedPurchaseQuantity: 40, status: 'New', createdDate: '2024-12-15', agingDays: 0, agingBucket: 'Fresh', nextFollowUp: '2024-12-16', assignedTo: 'Ravi K.', estimatedValue: 48000, remarks: 'Bulk inquiry - 40 units' },
    ];

    for (const lead of leads) {
      await pool.query(
        'INSERT INTO leads (id, call_id, customer_name, mobile, email, address, product_interest, planned_purchase_quantity, status, created_date, aging_days, aging_bucket, last_follow_up, next_follow_up, assigned_to, estimated_value, remarks) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)',
        [lead.id, lead.callId, lead.customerName, lead.mobile, lead.email || null, lead.address || null, lead.productInterest, lead.plannedPurchaseQuantity || null, lead.status, lead.createdDate, lead.agingDays, lead.agingBucket, lead.lastFollowUp || null, lead.nextFollowUp || null, lead.assignedTo, lead.estimatedValue || null, lead.remarks]
      );
    }
    console.log('✓ Leads seeded');

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
};

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export default seedData;
