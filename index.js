// index.js

// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");

const app = express();

// Middleware to parse JSON bodies in requests
app.use(express.json());

// Create a PostgreSQL connection pool using DATABASE_URL from environment variables
const pool = new Pool({
  // user: "ashfaqmahmood", // typically your OS user or the one you defined
  // host: "localhost",
  // database: "my_new_postgres_database", // name defined in your config
  // password: "36978514amrp", // if applicable
  // port: 5432,
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // Optional pool configuration
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait trying to connect before timing out
});

// Simple route: Get all users from the database
app.get("/users", async (req, res) => {
  try {
    // Use parameterized queries to avoid SQL injection vulnerabilities.
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ error: "Database query error" });
  }
});

// Example POST route: Insert a new user into the database
app.post("/users", async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  console.log(req.body); // check what data is coming in

  try {
    // Parameterized query: $1 and $2 are placeholders for the actual values.
    const insertQuery =
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *";
    const result = await pool.query(
      "INSERT INTO users (name, email, created_at) VALUES ($1, $2, NOW())",
      [name, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error inserting data", err);
    res.status(500).json({ error: "Database insert error" });
  }
});

// Start the server using the PORT environment variable
const PORT = process.env.PORT || 4500;
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}.`);
});
