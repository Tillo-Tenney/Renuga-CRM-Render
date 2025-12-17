import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import pool from '../config/database.js';
import { validateAndConvertFields } from '../utils/fieldValidator.js';

export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    // Fetch orders with their products
    const { rows: orders } = await pool.query(
      'SELECT * FROM orders ORDER BY order_date DESC'
    );

    // Fetch products for each order
    for (const order of orders) {
      const { rows: products } = await pool.query(
        'SELECT * FROM order_products WHERE order_id = $1',
        [order.id]
      );
      order.products = products;
    }

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = rows[0];
    
    // Fetch products for the order
    const { rows: products } = await pool.query(
      'SELECT * FROM order_products WHERE order_id = $1',
      [id]
    );
    order.products = products;
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      id,
      leadId,
      callId,
      customerName,
      mobile,
      deliveryAddress,
      products,
      totalAmount,
      status,
      orderDate,
      expectedDeliveryDate,
      actualDeliveryDate,
      agingDays,
      isDelayed,
      paymentStatus,
      invoiceNumber,
      assignedTo,
      remarks,
    } = req.body;

    // Insert order
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders 
       (id, lead_id, call_id, customer_name, mobile, delivery_address, total_amount,
        status, order_date, expected_delivery_date, actual_delivery_date, aging_days,
        is_delayed, payment_status, invoice_number, assigned_to, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [id, leadId || null, callId || null, customerName, mobile, deliveryAddress,
       totalAmount, status, orderDate, expectedDeliveryDate, actualDeliveryDate || null,
       agingDays || 0, isDelayed || false, paymentStatus, invoiceNumber || null,
       assignedTo, remarks]
    );

    const order = orderRows[0];

    // Insert order products
    if (products && products.length > 0) {
      for (const product of products) {
        await client.query(
          `INSERT INTO order_products 
           (order_id, product_id, product_name, quantity, unit, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, product.productId, product.productName, product.quantity,
           product.unit, product.unitPrice, product.totalPrice]
        );

        // Update product quantity with validation
        const result = await client.query(
          'UPDATE products SET available_quantity = available_quantity - $1 WHERE id = $2 AND available_quantity >= $1 RETURNING available_quantity',
          [product.quantity, product.productId]
        );
        
        if (result.rowCount === 0) {
          throw new Error(`Insufficient inventory for product ${product.productName}`);
        }
      }
    }

    await client.query('COMMIT');

    // Fetch complete order with products
    const { rows: completeOrder } = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );
    const { rows: orderProducts } = await pool.query(
      'SELECT * FROM order_products WHERE order_id = $1',
      [id]
    );
    completeOrder[0].products = orderProducts;

    res.status(201).json(completeOrder[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
};

export const updateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate and convert fields safely
    const { values, setClause } = validateAndConvertFields('orders', updates);

    if (!setClause) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { rows } = await pool.query(
      `UPDATE orders SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Fetch products for the order
    const { rows: products } = await pool.query(
      'SELECT * FROM order_products WHERE order_id = $1',
      [id]
    );
    rows[0].products = products;

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

export const deleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM orders WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};
