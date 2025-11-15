const express=require( "express");
const router = express.Router();
const db=require("./db")

// Borrow book route
router.post("/borrow", (req, res) => {
  const { userId, userName, bookId, bookTitle, borrowDate, returnDate } = req.body;

  if (!userId || !bookId) {
    return res.status(500).json({ message: "Missing user or book info" });
  }

  db.query( 
    "INSERT INTO borrowed_books (user_id, user_name, book_id, book_title, borrow_date, return_date)VALUES (?, ?, ?, ?, ?, ?,NOW())",

    [userId, userName, bookId, bookTitle, borrowDate, returnDate], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json({ success:true ,message: "✅ Book borrowed successfully!" });
  });
});

module.exports= router;
