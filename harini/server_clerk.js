// Lightweight server to run only the ClerkRole module for development
require('dotenv').config();
const express = require('express');
const path = require('path');

// Decide whether we will use a real DB before attempting to require it.
// This prevents startup from failing when `../db` is absent and we want to run
// the mock in-memory server (the common development case).
const useReal = process.env.USE_REAL_DB === 'true';
let db = null;
if (useReal) {
  try {
    db = require('../db');
  } catch (err) {
    // Warn but continue; server will fall back to mock DB endpoints.
    console.warn('Warning: ../db module not found; real DB mode unavailable. Falling back to mock DB.');
    db = null;
  }
}

const clerkRoutes = require('./backend/clerkRoutes');

const app = express();
app.use(express.json());

// Allow CORS and remove external Authorization headers so ClerkRole can be used standalone
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Strip any incoming Authorization header to bypass external auth checks for standalone mode
  delete req.headers.authorization;
  next();
});

// Serve books page at root for convenience (placed before static to ensure it matches)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'books.html'));
});

// Serve frontend files from ClerkRole/frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// If using mock DB (default), provide simple in-memory endpoints so frontend works without a real DB
if (!useReal) {
  // seed sample data: 45 realistic books, some users, borrow records and fines
  let books = [
    { title: 'Clean Code', author: 'Robert C. Martin', category: 'Programming', isbn: '9780132350884' },
    { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', category: 'Programming', isbn: '9780201616224' },
    { title: 'Introduction to Algorithms', author: 'Cormen, Leiserson, Rivest, Stein', category: 'Algorithms', isbn: '9780262033848' },
    { title: 'Design Patterns', author: 'Erich Gamma et al.', category: 'Programming', isbn: '9780201633610' },
    { title: 'Structure and Interpretation of Computer Programs', author: 'Harold Abelson', category: 'Programming', isbn: '9780262510875' },
    { title: 'Concrete Mathematics', author: 'Graham, Knuth, Patashnik', category: 'Mathematics', isbn: '9780201558029' },
    { title: 'Gödel, Escher, Bach', author: 'Douglas Hofstadter', category: 'Science', isbn: '9780465026562' },
    { title: 'The Mythical Man-Month', author: 'Frederick P. Brooks Jr.', category: 'Business', isbn: '9780201835953' },
    { title: 'The Art of Computer Programming', author: 'Donald Knuth', category: 'Algorithms', isbn: '9780201896831' },
    { title: 'Refactoring', author: 'Martin Fowler', category: 'Programming', isbn: '9780201485677' },
    { title: 'Deep Work', author: 'Cal Newport', category: 'Business', isbn: '9781455586691' },
    { title: 'Sapiens', author: 'Yuval Noah Harari', category: 'History', isbn: '9780062316097' },
    { title: '1984', author: 'George Orwell', category: 'Fiction', isbn: '9780451524935' },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Fiction', isbn: '9780060935467' },
    { title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'Science', isbn: '9780553380163' },
    { title: 'The Lean Startup', author: 'Eric Ries', category: 'Business', isbn: '9780307887894' },
    { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', category: 'Psychology', isbn: '9780374533557' },
    { title: 'The Design of Everyday Things', author: 'Don Norman', category: 'Design', isbn: '9780465050659' },
    { title: 'Algorithms', author: 'Robert Sedgewick', category: 'Algorithms', isbn: '9780321573513' },
    { title: 'Introduction to Statistical Learning', author: 'Gareth James', category: 'Mathematics', isbn: '9781461471370' },
    { title: 'Compilers: Principles, Techniques, and Tools', author: 'Aho, Lam, Sethi, Ullman', category: 'Programming', isbn: '9780321486813' },
    { title: 'Clean Architecture', author: 'Robert C. Martin', category: 'Programming', isbn: '9780134494166' },
    { title: 'The C Programming Language', author: 'Kernighan & Ritchie', category: 'Programming', isbn: '9780131103627' },
    { title: 'Head First Design Patterns', author: 'Eric Freeman', category: 'Programming', isbn: '9780596007126' },
    { title: 'The Self-Taught Programmer', author: 'Cory Althoff', category: 'Programming', isbn: '9780999685907' },
    { title: 'The Elements of Statistical Learning', author: 'Hastie, Tibshirani, Friedman', category: 'Mathematics', isbn: '9780387848570' },
    { title: 'Introduction to Machine Learning with Python', author: 'Andreas C. Müller', category: 'Programming', isbn: '9781449369415' },
    { title: 'The Clean Coder', author: 'Robert C. Martin', category: 'Programming', isbn: '9780137081073' },
    { title: 'The Innovators', author: 'Walter Isaacson', category: 'History', isbn: '9781476708706' },
    { title: 'The Odyssey', author: 'Homer', category: 'Fiction', isbn: '9780140268867' },
    { title: 'The Republic', author: 'Plato', category: 'Philosophy', isbn: '9780141442433' },
    { title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', category: 'Fiction', isbn: '9780141439570' },
    { title: 'The Road to Reality', author: 'Roger Penrose', category: 'Science', isbn: '9780679776314' },
    { title: 'Art & Visual Perception', author: 'Rudolf Arnheim', category: 'Art', isbn: '9780520209676' },
    { title: 'Business Model Generation', author: 'Alexander Osterwalder', category: 'Business', isbn: '9780470876411' },
    { title: 'The Elements of Style', author: 'Strunk & White', category: 'Writing', isbn: '9780205309023' },
    { title: 'The Pragmatic Programmer (20th Anniversary)', author: 'David Thomas', category: 'Programming', isbn: '9780135957059' },
    { title: 'Patterns of Enterprise Application Architecture', author: 'Martin Fowler', category: 'Programming', isbn: '9780321127426' },
    { title: 'Algorithms to Live By', author: 'Brian Christian', category: 'Algorithms', isbn: '9781627790369' },
  { title: 'Weapons of Math Destruction', author: "Cathy O'Neil", category: 'Science', isbn: '9780553418811' },
    { title: 'The Goal', author: 'Eliyahu M. Goldratt', category: 'Business', isbn: '9780884271956' },
    { title: 'Don Quixote', author: 'Miguel de Cervantes', category: 'Fiction', isbn: '9780060934347' }
  ];
  // assign incremental ids and normalize objects
  let nextId = 1;
  for (let i = 0; i < books.length; i++) {
    books[i].id = nextId++;
    if (!books[i].isbn) books[i].isbn = `978000000${1000 + books[i].id}`;
  }

  // users (expanded seed)
  let users = [
    { id: 1, name: 'Alice Johnson', employee_id: 'EMP001', mobile: '555-0100' },
    { id: 2, name: 'Bob Smith', employee_id: 'EMP002', mobile: '555-0101' },
    { id: 3, name: 'Carlos Martinez', employee_id: 'EMP003', mobile: '555-0102' },
    { id: 4, name: 'Diana Prince', employee_id: 'EMP004', mobile: '555-0103' },
    { id: 5, name: 'Ethan Clark', employee_id: 'EMP005', mobile: '555-0104' },
    { id: 6, name: 'Fiona Gallagher', employee_id: 'EMP006', mobile: '555-0105' },
    { id: 7, name: 'George Liu', employee_id: 'EMP007', mobile: '555-0106' },
    { id: 8, name: 'Hannah Kim', employee_id: 'EMP008', mobile: '555-0107' },
    { id: 9, name: 'Ibrahim Noor', employee_id: 'EMP009', mobile: '555-0108' },
    { id: 10, name: 'Jasmine Lee', employee_id: 'EMP010', mobile: '555-0109' },
    { id: 11, name: 'Kevin Brown', employee_id: 'EMP011', mobile: '555-0110' },
    { id: 12, name: 'Lina Ahmed', employee_id: 'EMP012', mobile: '555-0111' },
    { id: 13, name: 'Markus Vogel', employee_id: 'EMP013', mobile: '555-0112' },
    { id: 14, name: 'Nadia Petrova', employee_id: 'EMP014', mobile: '555-0113' },
    { id: 15, name: 'Oscar Diaz', employee_id: 'EMP015', mobile: '555-0114' },
    { id: 16, name: 'Priya Reddy', employee_id: 'EMP016', mobile: '555-0115' },
    { id: 17, name: 'Quentin Blake', employee_id: 'EMP017', mobile: '555-0116' },
    { id: 18, name: 'Rina Sato', employee_id: 'EMP018', mobile: '555-0117' },
    { id: 19, name: 'Samuel Okoro', employee_id: 'EMP019', mobile: '555-0118' },
    { id: 20, name: 'Tara Wilson', employee_id: 'EMP020', mobile: '555-0119' }
  ];
  let nextUserId = 21;

  // reservations
  let reservations = [ { id: 1, user_name: 'Alice', book_title: 'Sample Book 2', status: 'pending' } ];

  // policy
  let policy = { max_borrow_limit: 3, borrow_duration_days: 14, fine_per_day: 1 };

  // borrow_records: generate some records across recent days
  const borrow_records = [];
  const now = new Date();
  // generate borrow/return records and attach a random book id/title for reporting
  for (let d = 0; d < 30; d++) {
    const day = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    const dateStr = day.toISOString().slice(0, 10);
    const issues = Math.floor(Math.random() * 5) + 1;
    const returns = Math.floor(Math.random() * 4);
    for (let i = 0; i < issues; i++) {
      const b = books[Math.floor(Math.random() * books.length)];
      borrow_records.push({ id: borrow_records.length + 1, type: 'issue', created_at: dateStr, book_id: b.id, book_title: b.title });
    }
    for (let i = 0; i < returns; i++) {
      const b = books[Math.floor(Math.random() * books.length)];
      borrow_records.push({ id: borrow_records.length + 1, type: 'return', created_at: dateStr, book_id: b.id, book_title: b.title });
    }
  }

  // fines: some paid fines with dates and amounts
  const fines = [];
  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const paid_at = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const b = books[Math.floor(Math.random() * books.length)];
    fines.push({ id: i + 1, amount: Math.floor(Math.random() * 50) + 1, paid_at, book_id: b.id, book_title: b.title });
  }

  app.get('/api/books', (req, res) => res.json(books));

  app.post('/clerk/books', (req, res) => {
    const { isbn, title, author, category } = req.body;
    const b = { id: nextId++, isbn, title, author, category };
    books.unshift(b);
    res.json({ success: true, id: b.id, book: b });
  });

  app.put('/clerk/books/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const book = books.find(x => x.id === id);
    if (!book) return res.status(404).json({ success: false });
    Object.assign(book, req.body);
    res.json({ success: true, book });
  });

  app.delete('/clerk/books/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    books = books.filter(x => x.id !== id);
    res.json({ success: true });
  });

  app.get('/clerk/reports/daily', (req, res) => {
    const date = req.query.date || new Date().toISOString().slice(0,10);
    const data = borrow_records.filter(r => r.created_at === date).reduce((acc,r)=>{ acc[r.type]=(acc[r.type]||0)+1; return acc; }, {});
    const rows = Object.keys(data).map(k=>({ type: k, count: data[k] }));
    res.json({ success: true, date, data: rows });
  });

  app.get('/clerk/reports/fines', (req, res) => {
    const from = req.query.from || '1970-01-01';
    const to = req.query.to || new Date().toISOString().slice(0,10);
    const matched = fines.filter(f => f.paid_at >= from && f.paid_at <= to);
    const total = matched.reduce((s,f)=>s+f.amount,0);
    res.json({ success: true, total, from, to, fines: matched });
  });

  // return borrow/return records (with book info) in a date range
  app.get('/clerk/reports/books', (req, res) => {
    const from = req.query.from || '1970-01-01';
    const to = req.query.to || new Date().toISOString().slice(0,10);
    const matched = borrow_records.filter(r => r.created_at >= from && r.created_at <= to);
    res.json({ success: true, from, to, records: matched });
  });

  app.post('/clerk/policy', (req, res) => {
    policy = Object.assign(policy, req.body);
    res.json({ success: true, policy });
  });

  // expose current policy for the frontend
  app.get('/clerk/policy', (req, res) => {
    res.json({ success: true, policy });
  });

  app.get('/api/reservations', (req, res) => res.json(reservations));

  // users endpoints for clerk to manage users
  app.get('/api/users', (req, res) => res.json(users));
  app.post('/clerk/users', (req, res) => {
    const { name, employee_id, mobile } = req.body;
    const u = { id: nextUserId++, name, employee_id, mobile };
    users.push(u);
    res.json({ success: true, user: u });
  });
  app.delete('/clerk/users/:id', (req, res) => {
    const id = parseInt(req.params.id,10);
    const before = users.length;
    users = users.filter(u=>u.id!==id);
    res.json({ success: true, deleted: before - users.length });
  });

  app.post('/clerk/reservations/:id/approve', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const r = reservations.find(x => x.id === id);
    if (r) r.status = 'approved';
    res.json({ success: true, reservation: r });
  });

  app.post('/clerk/reservations/:id/reject', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const r = reservations.find(x => x.id === id);
    if (r) r.status = 'rejected';
    res.json({ success: true, reservation: r });
  });

  // Mount the original routes too (they will fallback to mock db if called)
  app.use('/clerk', clerkRoutes);
} else {
  // Real DB mode: mount the real routes
  app.get('/api/books', async (req, res) => {
    try {
      const sql = `SELECT id, isbn, title, author, category FROM books WHERE archived = 0 OR archived IS NULL ORDER BY id DESC LIMIT 500`;
      const [rows] = await db.promise().query(sql);
      res.json(rows);
    } catch (err) {
      console.error('Error fetching books for clerk server:', err.message);
      res.json([]);
    }
  });
  app.use('/clerk', clerkRoutes);
}

const PORT = process.env.CLERK_PORT || 6001;
app.listen(PORT, () => {
  console.log(`ClerkRole server running at http://localhost:${PORT}`);
  console.log(`Serving files from ${path.join(__dirname, 'frontend')}`);
});

// Serve books page at root for convenience
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'books.html'));
});

module.exports = app;
