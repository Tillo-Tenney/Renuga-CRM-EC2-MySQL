import express from 'express';
import { authenticate, authorizePageAccess } from '../middleware/auth.js';
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  getAllCustomers,
  createCustomer,
  updateCustomer,
  getAllUsers,
  createUser,
  updateUser,
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

// Users (part of MasterData)
router.get('/users', authorizePageAccess('MasterData'), getAllUsers);
router.post('/users', authorizePageAccess('MasterData'), createUser);
router.put('/users/:id', authorizePageAccess('MasterData'), updateUser);

// Shift Notes
router.get('/shift-notes', getAllShiftNotes);
router.post('/shift-notes', createShiftNote);
router.put('/shift-notes/:id', updateShiftNote);

// Remark Logs
router.get('/remark-logs', getRemarkLogs);
router.post('/remark-logs', createRemarkLog);

export default router;
