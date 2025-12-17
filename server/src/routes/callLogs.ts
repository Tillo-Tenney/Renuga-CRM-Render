import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getAllCallLogs,
  getCallLogById,
  createCallLog,
  updateCallLog,
  deleteCallLog,
} from '../controllers/callLogController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllCallLogs);
router.get('/:id', getCallLogById);
router.post('/', createCallLog);
router.put('/:id', updateCallLog);
router.delete('/:id', deleteCallLog);

export default router;
