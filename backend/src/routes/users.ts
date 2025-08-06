import express from 'express';
import { protect } from '../middleware/auth';

const router = express.Router();

// Placeholder routes - to be implemented
router.get('/profile', protect, (req, res) => {
  res.json({ success: true, message: 'User profile endpoint - coming soon' });
});

router.put('/profile', protect, (req, res) => {
  res.json({ success: true, message: 'Update user profile endpoint - coming soon' });
});

export default router;