import express from 'express';
import { authenticate, authorizePageAccess } from '../middleware/auth.js';
import {
  getAllLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
} from '../controllers/leadController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizePageAccess('Leads'), getAllLeads);
router.get('/:id', authorizePageAccess('Leads'), getLeadById);
router.post('/', authorizePageAccess('Leads'), createLead);
router.put('/:id', authorizePageAccess('Leads'), updateLead);
router.delete('/:id', authorizePageAccess('Leads'), deleteLead);

export default router;
