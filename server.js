const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");

const bookRoutes = require("./routes/bookRoutes");
const userRoutes = require("./routes/userRoutes");
const borrowRoutes = require("./routes/borrowRoutes");
const librarianRoutes = require("./routes/librarianRoutes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(express.static(__dirname));

// Routes
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/borrow", borrowRoutes);
app.use("/api/librarian", librarianRoutes);

// Test route
app.get("/api/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "Server is working!",
    timestamp: new Date() 
  });
});

// Debug route - MOVE THIS BEFORE 404 HANDLER
app.get("/api/debug/tables", async (req, res) => {
    try {
        // Show all tables in the database
        const [tables] = await db.execute("SHOW TABLES");
        
        // Check structure of each table
        const tableStructures = {};
        
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            const [columns] = await db.execute(`DESCRIBE ${tableName}`);
            tableStructures[tableName] = columns;
        }
        
        res.json({
            success: true,
            tables: tables,
            structures: tableStructures
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Something went wrong!" });
});

// 404 handler - THIS SHOULD BE LAST
//app.use((req, res) => {
  //res.status(404).json({ success: false, message: "Route not found" });
//});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 Library Information System Backend Ready!`);
});