// db.js
const mysql = require("mysql2");
//const db=mysql.createConnection({...});

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',          // change if needed
  password: '',           // your MySQL password
  database: 'library_db'  // your database name
});

db.connect(err => {
  if (err) {
    console.error('❌ MySQL Connection Error:', err);
  } else {
    console.log('✅ Connected to MySQL Database');
  }
});

module.exports = db;
//export default router;
