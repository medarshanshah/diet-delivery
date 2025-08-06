import express from 'express';
import { protect } from '../middleware/auth';

const router = express.Router();

// Placeholder routes - to be implemented
router.post('/meal-plan', protect, (req, res) => {
  res.json({ success: true, message: 'AI meal plan endpoint - coming soon' });
});

export default router;