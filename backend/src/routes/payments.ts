import express from 'express';
import { protect } from '../middleware/auth';

const router = express.Router();

// Placeholder routes - to be implemented
router.post('/initiate', protect, (req, res) => {
  res.json({ success: true, message: 'Payment initiation endpoint - coming soon' });
});

export default router;