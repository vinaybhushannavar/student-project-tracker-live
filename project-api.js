import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sql from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '10kb' }));
  app.use(express.static(path.join(__dirname, 'public')));

  // Initialize table on startup
  async function initDb() {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS projects (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          status TEXT NOT NULL
        )
      `;
      
      const countRes = await sql`SELECT COUNT(*)::int as count FROM projects`;
      if (countRes[0].count === 0) {
        await sql`INSERT INTO projects (name, status) VALUES ('Sample Project', 'Planned')`;
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
      const rows = await sql`SELECT id, name, status FROM projects ORDER BY id ASC`;
      res.json(rows);
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
      const result = await sql`
        INSERT INTO projects (name, status) 
        VALUES (${name.trim()}, ${status}) 
        RETURNING id, name, status
      `;
      res.status(201).json(result[0]);
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
      const result = await sql`
        UPDATE projects 
        SET name = ${name.trim()}, status = ${status} 
        WHERE id = ${id} 
        RETURNING id, name, status
      `;

      if (result.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(result[0]);
    } catch (err) {
      console.error('PUT Error:', err);
      res.status(500).json({ error: 'Failed to update project', details: err.message });
    }
  });

  // DELETE /api/projects/:id - Delete a project
  app.delete('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await sql`DELETE FROM projects WHERE id = ${id} RETURNING id`;

      if (result.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json({ success: true, id: Number(id) });
    } catch (err) {
      console.error('DELETE Error:', err);
      res.status(500).json({ error: 'Failed to delete project', details: err.message });
    }
  });

  return app;
}