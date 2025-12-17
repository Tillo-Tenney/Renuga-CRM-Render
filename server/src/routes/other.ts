import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  getAllCustomers,
  createCustomer,
  updateCustomer,
  getAllUsers,
  getAllShiftNotes,
  createShiftNote,
  updateShiftNote,
  getRemarkLogs,
  createRemarkLog,
} from '../controllers/otherController.js';

const router = express.Router();

router.use(authenticate);

// Tasks
router.get('/tasks', getAllTasks);
router.post('/tasks', createTask);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

// Customers
router.get('/customers', getAllCustomers);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);

// Users
router.get('/users', getAllUsers);

// Shift Notes
router.get('/shift-notes', getAllShiftNotes);
router.post('/shift-notes', createShiftNote);
router.put('/shift-notes/:id', updateShiftNote);

// Remark Logs
router.get('/remark-logs', getRemarkLogs);
router.post('/remark-logs', createRemarkLog);

export default router;
