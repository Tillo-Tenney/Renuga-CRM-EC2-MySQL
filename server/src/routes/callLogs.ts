import express from 'express';
import { authenticate, authorizePageAccess } from '../middleware/auth.js';
import {
  getAllCallLogs,
  getCallLogById,
  createCallLog,
  updateCallLog,
  deleteCallLog,
} from '../controllers/callLogController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizePageAccess('CallLog'), getAllCallLogs);
router.get('/:id', authorizePageAccess('CallLog'), getCallLogById);
router.post('/', authorizePageAccess('CallLog'), createCallLog);
router.put('/:id', authorizePageAccess('CallLog'), updateCallLog);
router.delete('/:id', authorizePageAccess('CallLog'), deleteCallLog);

export default router;
