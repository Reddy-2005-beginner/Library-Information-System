// routes/bookRoutes.js
//import express from "express";
//import db from "../db.js";
const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all books
router.get("/", ( req  ,res)=> {
  db.query('SELECT * FROM books', (err, results) => {
    if (err) {
      console.error('Error fetching books:', err);
      res.status(500).json({ message: 'Failed to fetch books' });
    }else {
    res.json(results);}
  });
});

// Delete a book
router.delete('/books/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM books WHERE serial_number = ?', [id], (err) => {
    if (err) {
      console.error('Error deleting book:', err);
      return res.status(500).json({ message: 'Failed to delete book' });
    }
    res.json({ message: 'Book deleted successfully' });
  });
});

// Update book status
router.put('/books/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.query('UPDATE books SET status = ? WHERE serial_number = ?', [status, id], (err) => {
    if (err) {
      console.error('Error updating book:', err);
      return res.status(500).json({ message: 'Failed to update book' });
    }
    res.json({ message: 'Book status updated' });
  });
});

module.exports = router;
//export default router;
