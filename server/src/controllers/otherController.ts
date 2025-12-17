import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import pool from '../config/database.js';
import { validateAndConvertFields } from '../utils/fieldValidator.js';

// Tasks, Customers, Users, Shift Notes, Remark Logs

// Tasks
export const getAllTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tasks ORDER BY due_date');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id, type, linkedTo, linkedId, customerName, dueDate, status, assignedTo, remarks } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO tasks (id, type, linked_to, linked_id, customer_name, due_date, status, assigned_to, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, type, linkedTo, linkedId, customerName, dueDate, status, assignedTo, remarks]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate and convert fields safely
    const { values, setClause } = validateAndConvertFields('tasks', updates);

    if (!setClause) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { rows } = await pool.query(
      `UPDATE tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

// Customers
export const getAllCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM customers ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id, name, mobile, email, address, totalOrders, totalValue } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO customers (id, name, mobile, email, address, total_orders, total_value)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, name, mobile, email || null, address || null, totalOrders || 0, totalValue || 0]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate and convert fields safely
    const { values, setClause } = validateAndConvertFields('customers', updates);

    if (!setClause) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { rows } = await pool.query(
      `UPDATE customers SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

// Users
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email, role, is_active FROM users ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Shift Notes
export const getAllShiftNotes = async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM shift_notes ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching shift notes:', error);
    res.status(500).json({ error: 'Failed to fetch shift notes' });
  }
};

export const createShiftNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id, createdBy, content, isActive } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO shift_notes (id, created_by, content, is_active)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, createdBy, content, isActive !== undefined ? isActive : true]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating shift note:', error);
    res.status(500).json({ error: 'Failed to create shift note' });
  }
};

export const updateShiftNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content, isActive } = req.body;

    const { rows } = await pool.query(
      `UPDATE shift_notes SET content = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *`,
      [id, content, isActive]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Shift note not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating shift note:', error);
    res.status(500).json({ error: 'Failed to update shift note' });
  }
};

// Remark Logs
export const getRemarkLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { entityType, entityId } = req.query;

    let query = 'SELECT * FROM remark_logs';
    const params: any[] = [];

    if (entityType && entityId) {
      query += ' WHERE entity_type = $1 AND entity_id = $2';
      params.push(entityType, entityId);
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching remark logs:', error);
    res.status(500).json({ error: 'Failed to fetch remark logs' });
  }
};

export const createRemarkLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id, entityType, entityId, remark, createdBy } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO remark_logs (id, entity_type, entity_id, remark, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, entityType, entityId, remark, createdBy]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating remark log:', error);
    res.status(500).json({ error: 'Failed to create remark log' });
  }
};
