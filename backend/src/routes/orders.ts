import express from 'express';
import { protect } from '../middleware/auth';

const router = express.Router();

// Placeholder routes - to be implemented
router.post('/', protect, (req, res) => {
  res.json({ success: true, message: 'Create order endpoint - coming soon' });
});

router.get('/', protect, (req, res) => {
  res.json({ success: true, message: 'Get orders endpoint - coming soon' });
});

export default router;