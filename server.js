// server.js
const express = require("express");
const db = require("./db"); // Import the database query function

const app = express();
const port = process.env.PORT || 3000; // Use port from .env or default to 3000

// Middleware to parse JSON request bodies
app.use(express.json());

// --- Define Routes ---

// Example: GET all items from a 'todos' table
app.get("/todos", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM todos ORDER BY id ASC");
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Example: GET a single item by ID
app.get("/todos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Use parameterized queries to prevent SQL injection!
    const { rows } = await db.query("SELECT * FROM todos WHERE id = $1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`Error fetching todo ${id}:`, error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Example: POST (create) a new item
app.post("/todos", async (req, res) => {
  const { description } = req.body; // Assuming request body has { "description": "..." }

  if (!description) {
    return res.status(400).json({ error: "Description is required" });
  }

  try {
    // Use parameterized query and RETURNING clause to get the created row back
    const insertQuery =
      "INSERT INTO todos (description) VALUES ($1) RETURNING *";
    const { rows } = await db.query(insertQuery, [description]);
    res.status(201).json(rows[0]); // Send back the newly created todo
  } catch (error) {
    console.error("Error creating todo:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Example: PUT (update) an existing item
app.put("/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { description, completed } = req.body; // Assuming body has { "description": "...", "completed": boolean }

  if (description === undefined && completed === undefined) {
    return res
      .status(400)
      .json({ error: "No update fields provided (description or completed)" });
  }

  // Build the query dynamically (carefully!)
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(description);
  }
  if (completed !== undefined) {
    fields.push(`completed = $${paramIndex++}`);
    values.push(completed);
  }

  values.push(id); // Add the ID for the WHERE clause

  const updateQuery = `UPDATE todos SET ${fields.join(
    ", "
  )} WHERE id = $${paramIndex} RETURNING *`;

  try {
    const { rows } = await db.query(updateQuery, values);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`Error updating todo ${id}:`, error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Example: DELETE an item
app.delete("/todos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleteQuery = "DELETE FROM todos WHERE id = $1 RETURNING *";
    const { rows } = await db.query(deleteQuery, [id]);

    if (rows.length === 0) {
      // Optionally, you could return 204 No Content even if not found,
      // as the desired state (item not present) is achieved.
      // Or return 404 if you want to signal it wasn't there.
      return res.status(404).json({ error: "Todo not found" });
    }
    // Send 200 OK with the deleted item, or just 204 No Content
    res
      .status(200)
      .json({ message: "Todo deleted successfully", deletedTodo: rows[0] });
    // or res.status(204).send();
  } catch (error) {
    console.error(`Error deleting todo ${id}:`, error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Start the Server ---
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
