import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Connect to Supabase PostgreSQL database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Supabase cloud connection
});

// Initialize table on startup
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL
      )
    `);
    
    const countRes = await pool.query('SELECT COUNT(*) as count FROM projects');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      await pool.query('INSERT INTO projects (name, status) VALUES ($1, $2)', ['Sample Project', 'Planned']);
    }
    console.log('Database connected and initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}
initDb();

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// GET /api/projects - Retrieve all projects
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, status FROM projects ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('GET Error:', err);
    res.status(500).json({ error: 'Failed to retrieve projects', details: err.message });
  }
});

// POST /api/projects - Create a new project
app.post('/api/projects', async (req, res) => {
  const { name, status } = req.body;
  if (!name || !status) {
    return res.status(400).json({ error: 'Name and status are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO projects (name, status) VALUES ($1, $2) RETURNING id, name, status',
      [name.trim(), status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST Error:', err);
    res.status(500).json({ error: 'Failed to create project', details: err.message });
  }
});

// PUT /api/projects/:id - Update an existing project
app.put('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;

  if (!name || !status) {
    return res.status(400).json({ error: 'Name and status are required' });
  }

  try {
    const result = await pool.query(
      'UPDATE projects SET name = $1, status = $2 WHERE id = $3 RETURNING id, name, status',
      [name.trim(), status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT Error:', err);
    res.status(500).json({ error: 'Failed to update project', details: err.message });
  }
});

// DELETE /api/projects/:id - Delete a project
app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ success: true, id: Number(id) });
  } catch (err) {
    console.error('DELETE Error:', err);
    res.status(500).json({ error: 'Failed to delete project', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});