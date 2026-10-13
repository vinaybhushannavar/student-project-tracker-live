import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { createApp } from './project-api.js';
import { db } from './database.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// API routes
app.use(createApp(db));

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Convenience routes for 3D Cosmos Space Experience
app.get('/cosmos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cosmos.html'));
});
app.get('/space', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cosmos.html'));
});

export default app;