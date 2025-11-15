const express = require('express');
const router = express.Router();
const controller = require('./clerkController');

// Book inventory
router.post('/books', controller.addBook);
router.put('/books/:id', controller.updateBook);
router.delete('/books/:id', controller.archiveBook);

// Reports
router.get('/reports/daily', controller.dailyReport);
router.get('/reports/fines', controller.fineReport);

// Policy
router.post('/policy', controller.setPolicy);

// Reservations
router.post('/reservations/:id/approve', controller.approveReservation);
router.post('/reservations/:id/reject', controller.rejectReservation);

module.exports = router;
