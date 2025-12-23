import express from 'express';
import { authenticate, authorizePageAccess } from '../middleware/auth.js';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizePageAccess('MasterData'), getAllProducts);
router.get('/:id', authorizePageAccess('MasterData'), getProductById);
router.post('/', authorizePageAccess('MasterData'), createProduct);
router.put('/:id', authorizePageAccess('MasterData'), updateProduct);
router.delete('/:id', authorizePageAccess('MasterData'), deleteProduct);

export default router;
