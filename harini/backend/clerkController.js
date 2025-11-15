let db = null;
try {
  db = require('../../db');
} catch (err) {
  console.warn('Warning: ../../db module not found; DB-backed routes will return errors if invoked.');
  // Provide a minimal placeholder that will throw controlled errors when used.
  db = {
    promise() {
      return {
        execute: async () => { throw new Error('DB module not available'); },
        query: async () => { throw new Error('DB module not available'); }
      };
    }
  };
}

// Helper to send consistent errors
function handleError(res, err) {
  console.error(err);
  // If DB is not available, make the error more explicit
  if (err && err.message && err.message.includes('DB module not available')) {
    return res.status(501).json({ success: false, message: 'DB not configured for this instance', detail: err.message });
  }
  res.status(500).json({ success: false, message: 'Server error', detail: err.message });
}

// Add a new book
async function addBook(req, res) {
  const { isbn, title, author, category } = req.body;
  if (!isbn || !title) return res.status(400).json({ success: false, message: 'ISBN and title required' });
  try {
    const sql = `INSERT INTO books (isbn, title, author, category, archived, created_at) VALUES (?, ?, ?, ?, 0, NOW())`;
    const [result] = await db.promise().execute(sql, [isbn, title, author || null, category || null]);
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    handleError(res, err);
  }
}

// Update book details
async function updateBook(req, res) {
  const id = req.params.id;
  const { isbn, title, author, category } = req.body;
  try {
    const sql = `UPDATE books SET isbn = ?, title = ?, author = ?, category = ?, updated_at = NOW() WHERE id = ?`;
    const [result] = await db.promise().execute(sql, [isbn, title, author, category, id]);
    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    handleError(res, err);
  }
}

// Archive (soft-delete) a book
async function archiveBook(req, res) {
  const id = req.params.id;
  try {
    // Try to set 'archived' flag; if column doesn't exist fall back to delete
    try {
      const sql = `UPDATE books SET archived = 1, updated_at = NOW() WHERE id = ?`;
      const [result] = await db.promise().execute(sql, [id]);
      return res.json({ success: true, method: 'archive', affectedRows: result.affectedRows });
    } catch (e) {
      // on error (e.g., column missing), try delete
      const sql2 = `DELETE FROM books WHERE id = ?`;
      const [result2] = await db.promise().execute(sql2, [id]);
      return res.json({ success: true, method: 'delete', affectedRows: result2.affectedRows });
    }
  } catch (err) {
    handleError(res, err);
  }
}

// Daily issues/returns report (basic)
async function dailyReport(req, res) {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  try {
    // Assumes a borrow_records table with type='issue' or 'return' and created_at
    const sql = `SELECT type, COUNT(*) AS count FROM borrow_records WHERE DATE(created_at) = ? GROUP BY type`;
    const [rows] = await db.promise().execute(sql, [date]);
    res.json({ success: true, date, data: rows });
  } catch (err) {
    // If table or columns don't exist, return friendly fallback
    if (err && err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ success: false, message: 'Table borrow_records not found. Create it or adapt SQL.', detail: err.message });
    }
    handleError(res, err);
  }
}

// Fine collection report (sum)
async function fineReport(req, res) {
  const from = req.query.from;
  const to = req.query.to;
  try {
    // Assumes a fines/payments table with amount and paid_at
    const sql = `SELECT SUM(amount) as total FROM fines WHERE paid_at BETWEEN ? AND ?`;
    const [rows] = await db.promise().execute(sql, [from || '1970-01-01', to || new Date().toISOString().slice(0, 10)]);
    res.json({ success: true, total: rows[0].total || 0 });
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ success: false, message: 'Table fines not found. Create it or adapt SQL.', detail: err.message });
    }
    handleError(res, err);
  }
}

// Set library policy (persist to library_policy table)
async function setPolicy(req, res) {
  const { max_borrow_limit, borrow_duration_days, fine_per_day } = req.body;
  try {
    // upsert pattern: create table library_policy with single row id=1
    const sql = `INSERT INTO library_policy (id, max_borrow_limit, borrow_duration_days, fine_per_day, updated_at)
      VALUES (1, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE max_borrow_limit = VALUES(max_borrow_limit), borrow_duration_days = VALUES(borrow_duration_days), fine_per_day = VALUES(fine_per_day), updated_at = NOW()`;
    const [result] = await db.promise().execute(sql, [max_borrow_limit || 3, borrow_duration_days || 14, fine_per_day || 1]);
    res.json({ success: true });
  } catch (err) {
    handleError(res, err);
  }
}

// Approve reservation
async function approveReservation(req, res) {
  const id = req.params.id;
  try {
    const sql = `UPDATE reservations SET status = 'approved', processed_at = NOW() WHERE id = ?`;
    const [result] = await db.promise().execute(sql, [id]);
    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    handleError(res, err);
  }
}

// Reject reservation
async function rejectReservation(req, res) {
  const id = req.params.id;
  const reason = req.body.reason || null;
  try {
    const sql = `UPDATE reservations SET status = 'rejected', processed_at = NOW(), processed_reason = ? WHERE id = ?`;
    const [result] = await db.promise().execute(sql, [reason, id]);
    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    handleError(res, err);
  }
}

module.exports = {
  addBook,
  updateBook,
  archiveBook,
  dailyReport,
  fineReport,
  setPolicy,
  approveReservation,
  rejectReservation
};
