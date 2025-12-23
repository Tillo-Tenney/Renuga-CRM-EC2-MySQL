import express from 'express';
import { authenticate, authorizePageAccess } from '../middleware/auth.js';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} from '../controllers/orderController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizePageAccess('Orders'), getAllOrders);
router.get('/:id', authorizePageAccess('Orders'), getOrderById);
router.post('/', authorizePageAccess('Orders'), createOrder);
router.put('/:id', authorizePageAccess('Orders'), updateOrder);
router.delete('/:id', authorizePageAccess('Orders'), deleteOrder);

export default router;
