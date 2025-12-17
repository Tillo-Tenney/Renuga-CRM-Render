import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getAllLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
} from '../controllers/leadController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllLeads);
router.get('/:id', getLeadById);
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

export default router;
