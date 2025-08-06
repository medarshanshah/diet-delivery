import express from 'express';
import { protect } from '../middleware/auth';

const router = express.Router();

// Placeholder routes - to be implemented
router.get('/', protect, (req, res) => {
  res.json({ success: true, message: 'Health challenges endpoint - coming soon' });
});

export default router;