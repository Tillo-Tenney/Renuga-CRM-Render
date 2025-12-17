import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import pool from '../config/database.js';
import { validateAndConvertFields } from '../utils/fieldValidator.js';

export const getAllLeads = async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM leads ORDER BY created_date DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

export const getLeadById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
};

export const createLead = async (req: AuthRequest, res: Response) => {
  try {
    const {
      id,
      callId,
      customerName,
      mobile,
      email,
      address,
      productInterest,
      plannedPurchaseQuantity,
      status,
      createdDate,
      agingDays,
      agingBucket,
      lastFollowUp,
      nextFollowUp,
      assignedTo,
      estimatedValue,
      remarks,
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO leads 
       (id, call_id, customer_name, mobile, email, address, product_interest, 
        planned_purchase_quantity, status, created_date, aging_days, aging_bucket,
        last_follow_up, next_follow_up, assigned_to, estimated_value, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [id, callId || null, customerName, mobile, email || null, address || null, 
       productInterest, plannedPurchaseQuantity || null, status, createdDate, 
       agingDays || 0, agingBucket, lastFollowUp || null, nextFollowUp || null, 
       assignedTo, estimatedValue || null, remarks]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
};

export const updateLead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate and convert fields safely
    const { values, setClause } = validateAndConvertFields('leads', updates);

    if (!setClause) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { rows } = await pool.query(
      `UPDATE leads SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
};

export const deleteLead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM leads WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ success: true, message: 'Lead deleted' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
};
