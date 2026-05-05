const express = require('express');
const {
  getServices,
  getServicesByCategory,
  getServicesByProvider,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController');
const { protect, providerOnly, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getServices);
router.get('/category/:categoryId', getServicesByCategory);
router.get('/provider/:providerId', getServicesByProvider);
router.post('/', protect, providerOnly, createService);
router.put('/:id', protect, updateService);
router.delete('/:id', protect, deleteService);

module.exports = router;