const express = require("express");
const db = require("./db");
const router = express.Router();

// Test route
router.get("/debug/tables", (req, res) => {
    res.json({ success: true, message: "Librarian routes are working!" });
});

// Add Book
router.post("/addBook", async (req, res) => {
    try {
        const { title, author, isbn, copies } = req.body;
        
        console.log("Received book data:", { title, author, isbn, copies });
        
        if (!title || !author || !isbn || !copies) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Try different possible table and column names
        let query, params;
        
        try {
            // Try addbooks table first
            query = `INSERT INTO addbooks (book_title, author, isbn_number, copies, status) VALUES (?, ?, ?, ?, 'Available')`;
            params = [title, author, isbn, copies];
            const [result] = await db.execute(query, params);
            
            res.json({ 
                success: true, 
                message: 'Book added successfully!', 
                bookId: result.insertId 
            });
        } catch (error) {
            // If addbooks fails, try books table
            console.log('addbooks table failed, trying books table...');
            
            query = `INSERT INTO books (book_title, author, isbn_number, copies, status) VALUES (?, ?, ?, ?, 'Available')`;
            params = [title, author, isbn, copies];
            const [result] = await db.execute(query, params);
            
            res.json({ 
                success: true, 
                message: 'Book added successfully!', 
                bookId: result.insertId 
            });
        }
    } catch (error) {
        console.error('Error adding book:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ success: false, message: 'Book with this ISBN already exists' });
        } else if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(500).json({ success: false, message: 'Database tables not set up properly. Please run the setup script.' });
        } else {
            res.status(500).json({ success: false, message: 'Error adding book', error: error.message });
        }
    }
});

// Get All Books
router.get("/books", async (req, res) => {
    try {
        let query, books;
        
        try {
            // Try addbooks table first
            query = 'SELECT * FROM addbooks ORDER BY serial_number DESC';
            [books] = await db.execute(query);
        } catch (error) {
            // If addbooks fails, try books table
            console.log('addbooks table failed, trying books table...');
            query = 'SELECT * FROM books ORDER BY id DESC';
            [books] = await db.execute(query);
        }
        
        console.log(`Found ${books.length} books`);
        res.json({ success: true, data: books });
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ success: false, message: 'Error fetching books', error: error.message });
    }
});

// Update Book
router.put("/updateBook/:id", async (req, res) => {
    try {
        const bookId = req.params.id;
        const { title, author, isbn, copies } = req.body;
        
        if (!title || !author || !isbn || !copies) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        let query, result;
        
        try {
            // Try addbooks table first
            query = `UPDATE addbooks SET book_title = ?, author = ?, isbn_number = ?, copies = ?, status = CASE WHEN ? > 0 THEN 'Available' ELSE 'Not Available' END WHERE serial_number = ?`;
            [result] = await db.execute(query, [title, author, isbn, copies, copies, bookId]);
        } catch (error) {
            // If addbooks fails, try books table
            console.log('addbooks table failed, trying books table...');
            query = `UPDATE books SET book_title = ?, author = ?, isbn_number = ?, copies = ?, status = CASE WHEN ? > 0 THEN 'Available' ELSE 'Not Available' END WHERE id = ?`;
            [result] = await db.execute(query, [title, author, isbn, copies, copies, bookId]);
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }
        
        res.json({ success: true, message: 'Book updated successfully!' });
    } catch (error) {
        console.error('Error updating book:', error);
        res.status(500).json({ success: false, message: 'Error updating book', error: error.message });
    }
});

// Delete Book
router.delete("/deleteBook/:id", async (req, res) => {
    try {
        const bookId = req.params.id;

        // Check if book is currently issued
        const checkIssuesQuery = 'SELECT * FROM issues WHERE book_id = ? AND status = "Issued"';
        const [issues] = await db.execute(checkIssuesQuery, [bookId]);
        
        if (issues.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete book. It is currently issued to students.' 
            });
        }

        let query, result;
        
        try {
            // Try addbooks table first
            query = 'DELETE FROM addbooks WHERE serial_number = ?';
            [result] = await db.execute(query, [bookId]);
        } catch (error) {
            // If addbooks fails, try books table
            console.log('addbooks table failed, trying books table...');
            query = 'DELETE FROM books WHERE id = ?';
            [result] = await db.execute(query, [bookId]);
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }
        
        res.json({ success: true, message: 'Book deleted successfully!' });
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({ success: false, message: 'Error deleting book', error: error.message });
    }
});

// Add Student
router.post("/addStudent", async (req, res) => {
    try {
        const { name, roll, email, phone } = req.body;
        
        if (!name || !roll) {
            return res.status(400).json({ success: false, message: 'Name and roll number are required' });
        }

        const query = 'INSERT INTO students (name, roll_number, email, phone) VALUES (?, ?, ?, ?)';
        const [result] = await db.execute(query, [name, roll, email || null, phone || null]);
        
        res.json({ 
            success: true, 
            message: 'Student added successfully!', 
            studentId: result.insertId 
        });
    } catch (error) {
        console.error('Error adding student:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ success: false, message: 'Student with this roll number already exists' });
        } else if (error.code === 'ER_NO_SUCH_TABLE') {
            // Create students table if it doesn't exist
            await createStudentsTable();
            // Retry the insert
            const query = 'INSERT INTO students (name, roll_number, email, phone) VALUES (?, ?, ?, ?)';
            const [result] = await db.execute(query, [name, roll, email || null, phone || null]);
            res.json({ 
                success: true, 
                message: 'Student added successfully!', 
                studentId: result.insertId 
            });
        } else {
            res.status(500).json({ success: false, message: 'Error adding student', error: error.message });
        }
    }
});

// Get All Students
router.get("/students", async (req, res) => {
    try {
        const query = 'SELECT * FROM students ORDER BY id';
        const [students] = await db.execute(query);
        
        console.log(`Found ${students.length} students`);
        res.json({ success: true, data: students });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ success: false, message: 'Error fetching students', error: error.message });
    }
});

// Update Student
router.put("/updateStudent/:id", async (req, res) => {
    try {
        const studentId = req.params.id;
        const { name, roll, email, phone } = req.body;
        
        if (!name || !roll) {
            return res.status(400).json({ success: false, message: 'Name and roll number are required' });
        }

        const query = 'UPDATE students SET name = ?, roll_number = ?, email = ?, phone = ? WHERE id = ?';
        const [result] = await db.execute(query, [name, roll, email, phone, studentId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        
        res.json({ success: true, message: 'Student updated successfully!' });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ success: false, message: 'Error updating student', error: error.message });
    }
});

// Delete Student
router.delete("/deleteStudent/:id", async (req, res) => {
    try {
        const studentId = req.params.id;

        // Check if student has issued books
        const checkIssuesQuery = 'SELECT * FROM issues WHERE student_id = ? AND status = "Issued"';
        const [issues] = await db.execute(checkIssuesQuery, [studentId]);
        
        if (issues.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete student. They have issued books that need to be returned first.' 
            });
        }

        const query = 'DELETE FROM students WHERE id = ?';
        const [result] = await db.execute(query, [studentId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        
        res.json({ success: true, message: 'Student deleted successfully!' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ success: false, message: 'Error deleting student', error: error.message });
    }
});

// Issue Book
router.post("/issueBook", async (req, res) => {
    try {
        const { book_id, student_id, issue_date } = req.body;
        
        if (!book_id || !student_id || !issue_date) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Check if book exists and is available
        let bookCheckQuery, books;
        try {
            bookCheckQuery = 'SELECT * FROM addbooks WHERE serial_number = ? AND status = "Available" AND copies > 0';
            [books] = await db.execute(bookCheckQuery, [book_id]);
        } catch (error) {
            bookCheckQuery = 'SELECT * FROM books WHERE id = ? AND status = "Available" AND copies > 0';
            [books] = await db.execute(bookCheckQuery, [book_id]);
        }
        
        if (books.length === 0) {
            return res.status(400).json({ success: false, message: 'Book not available or not found' });
        }

        // Check if student exists
        const studentCheckQuery = 'SELECT * FROM students WHERE id = ?';
        const [students] = await db.execute(studentCheckQuery, [student_id]);
        
        if (students.length === 0) {
            return res.status(400).json({ success: false, message: 'Student not found' });
        }

        // Insert into issues table
        const issueQuery = 'INSERT INTO issues (book_id, student_id, issue_date, status) VALUES (?, ?, ?, "Issued")';
        const [result] = await db.execute(issueQuery, [book_id, student_id, issue_date]);
        
        // Update book copies and status
        let updateBookQuery;
        try {
            updateBookQuery = 'UPDATE addbooks SET copies = copies - 1, status = CASE WHEN copies - 1 <= 0 THEN "Not Available" ELSE "Available" END WHERE serial_number = ?';
            await db.execute(updateBookQuery, [book_id]);
        } catch (error) {
            updateBookQuery = 'UPDATE books SET copies = copies - 1, status = CASE WHEN copies - 1 <= 0 THEN "Not Available" ELSE "Available" END WHERE id = ?';
            await db.execute(updateBookQuery, [book_id]);
        }
        
        res.json({ 
            success: true,
            message: 'Book issued successfully!', 
            issueId: result.insertId 
        });
    } catch (error) {
        console.error('Error issuing book:', error);
        res.status(500).json({ success: false, message: 'Error issuing book', error: error.message });
    }
});

// Return Book
router.put("/returnBook/:id", async (req, res) => {
    try {
        const issueId = req.params.id;
        const { return_date } = req.body;
        
        if (!return_date) {
            return res.status(400).json({ success: false, message: 'Return date is required' });
        }

        // Get issue details
        const issueQuery = 'SELECT * FROM issues WHERE id = ? AND status = "Issued"';
        const [issues] = await db.execute(issueQuery, [issueId]);
        
        if (issues.length === 0) {
            return res.status(400).json({ success: false, message: 'Issue record not found or already returned' });
        }

        const issue = issues[0];

        // Update issue record
        const updateIssueQuery = 'UPDATE issues SET return_date = ?, status = "Returned" WHERE id = ?';
        await db.execute(updateIssueQuery, [return_date, issueId]);

        // Update book copies and status
        let updateBookQuery;
        try {
            updateBookQuery = 'UPDATE addbooks SET copies = copies + 1, status = CASE WHEN copies + 1 > 0 THEN "Available" ELSE "Not Available" END WHERE serial_number = ?';
            await db.execute(updateBookQuery, [issue.book_id]);
        } catch (error) {
            updateBookQuery = 'UPDATE books SET copies = copies + 1, status = CASE WHEN copies + 1 > 0 THEN "Available" ELSE "Not Available" END WHERE id = ?';
            await db.execute(updateBookQuery, [issue.book_id]);
        }

        res.json({ success: true, message: 'Book returned successfully!' });
    } catch (error) {
        console.error('Error returning book:', error);
        res.status(500).json({ success: false, message: 'Error returning book', error: error.message });
    }
});

// Get All Issues
router.get("/issues", async (req, res) => {
    try {
        let query, issues;
        
        try {
            query = `SELECT i.*, b.book_title, b.isbn_number, s.name as student_name, s.roll_number FROM issues i JOIN addbooks b ON i.book_id = b.serial_number JOIN students s ON i.student_id = s.id ORDER BY i.issue_date DESC`;
            [issues] = await db.execute(query);
        } catch (error) {
            query = `SELECT i.*, b.book_title, b.isbn_number, s.name as student_name, s.roll_number FROM issues i JOIN books b ON i.book_id = b.id JOIN students s ON i.student_id = s.id ORDER BY i.issue_date DESC`;
            [issues] = await db.execute(query);
        }
        
        console.log(`Found ${issues.length} issues`);
        res.json({ success: true, data: issues });
    } catch (error) {
        console.error('Error fetching issues:', error);
        res.status(500).json({ success: false, message: 'Error fetching issues', error: error.message });
    }
});

// Get Dashboard Statistics
router.get("/stats", async (req, res) => {
    try {
        let totalBooks, totalStudents, issuedBooks, availableBooks;
        
        try {
            [totalBooks] = await db.execute('SELECT COUNT(*) as count FROM addbooks');
            [availableBooks] = await db.execute('SELECT COUNT(*) as count FROM addbooks WHERE status = "Available"');
        } catch (error) {
            [totalBooks] = await db.execute('SELECT COUNT(*) as count FROM books');
            [availableBooks] = await db.execute('SELECT COUNT(*) as count FROM books WHERE status = "Available"');
        }
        
        [totalStudents] = await db.execute('SELECT COUNT(*) as count FROM students');
        [issuedBooks] = await db.execute('SELECT COUNT(*) as count FROM issues WHERE status = "Issued"');
        
        const stats = {
            totalBooks: totalBooks[0].count,
            totalStudents: totalStudents[0].count,
            issuedBooks: issuedBooks[0].count,
            availableBooks: availableBooks[0].count
        };
        
        console.log("Statistics:", stats);
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching statistics', error: error.message });
    }
});

// Helper function to create students table if it doesn't exist
async function createStudentsTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            roll_number VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    await db.execute(createTableQuery);
    console.log('Students table created or already exists');
}

module.exports = router;