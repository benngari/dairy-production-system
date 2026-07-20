const express = require('express');
const router = express.Router();
const { calculateCosting } = require('../controllers/costingController');
const { protect } = require('../middleware/auth');

router.post('/calculate', protect, calculateCosting);

module.exports = router;