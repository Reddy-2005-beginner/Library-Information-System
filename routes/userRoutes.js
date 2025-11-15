const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");

// =========================
// REGISTER USER
// =========================
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, username, password } = req.body;

    console.log("📝 Registration attempt:", { fullName, email, username });

    // Validation
    if (!fullName || !email || !username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    // Check if user exists
    const checkSql = `SELECT * FROM users WHERE email = ? OR username = ?`;
    
    db.query(checkSql, [email, username], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error"
        });
      }

      if (results.length > 0) {
        const existing = results[0];
        if (existing.email === email) {
          return res.status(400).json({
            success: false,
            message: "Email already registered"
          });
        }
        if (existing.username === username) {
          return res.status(400).json({
            success: false,
            message: "Username already taken"
          });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const insertSql = `
        INSERT INTO users (full_name, email, username, password) 
        VALUES (?, ?, ?, ?)
      `;

      db.query(insertSql, [fullName, email, username, hashedPassword], (err, result) => {
        if (err) {
          console.error("Insert error:", err);
          return res.status(500).json({
            success: false,
            message: "Error creating user account"
          });
        }

        console.log("✅ User registered with ID:", result.insertId);
        
        // Return user data for immediate login
        const userData = {
          id: result.insertId,
          full_name: fullName,
          email: email,
          username: username,
          memberId: `LIB${result.insertId.toString().padStart(6, '0')}`,
          membershipDate: new Date().toLocaleDateString(),
          booksBorrowed: 0,
          booksReturned: 0,
          currentBooks: 0
        };

        res.json({
          success: true,
          message: "Registration successful!",
          user: userData
        });
      });
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// =========================
// LOGIN USER
// =========================
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  console.log("🔐 Login attempt for:", username);

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password required"
    });
  }

  const sql = `SELECT * FROM users WHERE username = ? OR email = ?`;
  
  db.query(sql, [username, username], async (err, results) => {
    if (err) {
      console.error("Login DB error:", err);
      return res.status(500).json({
        success: false,
        message: "Database error during login"
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    const user = results[0];

    // Compare passwords
    try {
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password"
        });
      }

      // Create user data for response
      const userData = {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        username: user.username,
        memberId: `LIB${user.id.toString().padStart(6, '0')}`,
        membershipDate: new Date(user.created_at).toLocaleDateString(),
        booksBorrowed: 0,
        booksReturned: 0,
        currentBooks: 0
      };

      // Login successful
      res.json({
        success: true,
        message: `Welcome back, ${user.full_name}!`,
        user: userData
      });

    } catch (error) {
      console.error("Password compare error:", error);
      res.status(500).json({
        success: false,
        message: "Authentication error"
      });
    }
  });
});

// =========================
// GET USER PROFILE
// =========================
router.get("/profile/:id", (req, res) => {
  const userId = req.params.id;

  const sql = `SELECT id, full_name, email, username, created_at FROM users WHERE id = ?`;
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Profile fetch error:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching user profile"
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const user = results[0];
    
    // Get book statistics (you can implement this later)
    const userData = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      username: user.username,
      memberId: `LIB${user.id.toString().padStart(6, '0')}`,
      membershipDate: new Date(user.created_at).toLocaleDateString(),
      booksBorrowed: 0,
      booksReturned: 0,
      currentBooks: 0
    };

    res.json({
      success: true,
      profile: userData
    });
  });
});

// =========================
// UPDATE USER PROFILE
// =========================
router.put("/profile/:id", (req, res) => {
  const userId = req.params.id;
  const { full_name, email, phone, address, dob } = req.body;

  const sql = `
    UPDATE users 
    SET full_name = ?, email = ?, phone = ?, address = ?, dob = ?
    WHERE id = ?
  `;

  db.query(sql, [full_name, email, phone, address, dob, userId], (err, result) => {
    if (err) {
      console.error("Profile update error:", err);
      return res.status(500).json({
        success: false,
        message: "Error updating profile"
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully"
    });
  });
});

module.exports = router;