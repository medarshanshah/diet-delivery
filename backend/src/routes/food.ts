import express from 'express';
import { optionalAuth } from '../middleware/auth';

const router = express.Router();

// Placeholder routes - to be implemented
router.get('/items', optionalAuth, (req, res) => {
  res.json({ success: true, message: 'Food items endpoint - coming soon' });
});

router.get('/categories', (req, res) => {
  res.json({ success: true, message: 'Food categories endpoint - coming soon' });
});

export default router;