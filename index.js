const express = require('express');
const router = express.Router();

const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');
const borrowRoutes = require('./routes/borrowRoutes');

router.use('/api/users', userRoutes);
router.use('/api/books', bookRoutes);
router.use('/api/borrow', borrowRoutes);

module.exports = router;
