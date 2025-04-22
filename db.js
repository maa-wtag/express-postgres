// db.js
require("dotenv").config(); // Load environment variables from .env file
const { Pool } = require("pg");

// Create a new pool instance
// The Pool manages multiple client connections
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // Optional pool configuration
  // max: 20, // Maximum number of clients in the pool
  // idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  // connectionTimeoutMillis: 2000, // How long to wait trying to connect before timing out
});

// Optional: Test the connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error("Error acquiring client", err.stack);
  }
  console.log("Successfully connected to PostgreSQL database!");
  client.query("SELECT NOW()", (err, result) => {
    release(); // Release the client back to the pool
    if (err) {
      return console.error("Error executing query", err.stack);
    }
    console.log("Current time from DB:", result.rows[0].now);
  });
});

// Export a query function to interact with the pool
module.exports = {
  query: (text, params) => pool.query(text, params),
  // Optionally, you might want to export the pool itself for more complex scenarios
  // getClient: () => pool.connect(), // For transactions
  // pool: pool
};
