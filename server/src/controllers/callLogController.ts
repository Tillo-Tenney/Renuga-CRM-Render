import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import pool from '../config/database.js';
import { validateAndConvertFields } from '../utils/fieldValidator.js';

export const getAllCallLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM call_logs ORDER BY call_date DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching call logs:', error);
    res.status(500).json({ error: 'Failed to fetch call logs' });
  }
};

export const getCallLogById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM call_logs WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Call log not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching call log:', error);
    res.status(500).json({ error: 'Failed to fetch call log' });
  }
};

export const createCallLog = async (req: AuthRequest, res: Response) => {
  try {
    const {
      id,
      callDate,
      customerName,
      mobile,
      queryType,
      productInterest,
      nextAction,
      followUpDate,
      remarks,
      assignedTo,
      status,
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO call_logs 
       (id, call_date, customer_name, mobile, query_type, product_interest, 
        next_action, follow_up_date, remarks, assigned_to, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [id, callDate, customerName, mobile, queryType, productInterest, 
       nextAction, followUpDate || null, remarks, assignedTo, status]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating call log:', error);
    res.status(500).json({ error: 'Failed to create call log' });
  }
};

export const updateCallLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate and convert fields safely
    const { values, setClause } = validateAndConvertFields('callLogs', updates);

    if (!setClause) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { rows } = await pool.query(
      `UPDATE call_logs SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Call log not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating call log:', error);
    res.status(500).json({ error: 'Failed to update call log' });
  }
};

export const deleteCallLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM call_logs WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Call log not found' });
    }

    res.json({ success: true, message: 'Call log deleted' });
  } catch (error) {
    console.error('Error deleting call log:', error);
    res.status(500).json({ error: 'Failed to delete call log' });
  }
};
