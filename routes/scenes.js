const express = require('express');
const { getDatabase } = require('../db/database');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const sceneSchema = Joi.object({
  title: Joi.string().required().max(200),
  description: Joi.string().required().max(2000),
  tags: Joi.string().allow('').max(500)
});

const updateSceneSchema = Joi.object({
  title: Joi.string().max(200),
  description: Joi.string().max(2000),
  tags: Joi.string().allow('').max(500)
});

// GET /api/scenes - List all scenes
router.get('/', (req, res) => {
  const db = getDatabase();
  const { search, limit = 50, offset = 0 } = req.query;
  
  let sql = 'SELECT * FROM scenes';
  let params = [];
  
  if (search) {
    sql += ' WHERE title LIKE ? OR description LIKE ? OR tags LIKE ?';
    const searchParam = `%${search}%`;
    params = [searchParam, searchParam, searchParam];
  }
  
  sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error fetching scenes:', err);
      return res.status(500).json({ error: 'Failed to fetch scenes' });
    }
    res.json(rows);
  });
});

// GET /api/scenes/:id - Get specific scene
router.get('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  db.get('SELECT * FROM scenes WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching scene:', err);
      return res.status(500).json({ error: 'Failed to fetch scene' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Scene not found' });
    }
    
    res.json(row);
  });
});

// POST /api/scenes - Create new scene
router.post('/', (req, res) => {
  const { error, value } = sceneSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  const db = getDatabase();
  const { title, description, tags } = value;
  
  const sql = 'INSERT INTO scenes (title, description, tags) VALUES (?, ?, ?)';
  
  db.run(sql, [title, description, tags || ''], function(err) {
    if (err) {
      console.error('Error creating scene:', err);
      return res.status(500).json({ error: 'Failed to create scene' });
    }
    
    // Fetch the created scene
    db.get('SELECT * FROM scenes WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        console.error('Error fetching created scene:', err);
        return res.status(500).json({ error: 'Scene created but failed to fetch' });
      }
      
      res.status(201).json(row);
    });
  });
});

// PUT /api/scenes/:id - Update scene
router.put('/:id', (req, res) => {
  const { error, value } = updateSceneSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  const db = getDatabase();
  const { id } = req.params;
  
  // Build dynamic update query
  const updates = [];
  const params = [];
  
  Object.keys(value).forEach(key => {
    updates.push(`${key} = ?`);
    params.push(value[key]);
  });
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  
  const sql = `UPDATE scenes SET ${updates.join(', ')} WHERE id = ?`;
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error('Error updating scene:', err);
      return res.status(500).json({ error: 'Failed to update scene' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Scene not found' });
    }
    
    // Fetch updated scene
    db.get('SELECT * FROM scenes WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error fetching updated scene:', err);
        return res.status(500).json({ error: 'Scene updated but failed to fetch' });
      }
      
      res.json(row);
    });
  });
});

// DELETE /api/scenes/:id - Delete scene
router.delete('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  db.run('DELETE FROM scenes WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting scene:', err);
      return res.status(500).json({ error: 'Failed to delete scene' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Scene not found' });
    }
    
    res.json({ message: 'Scene deleted successfully' });
  });
});

// POST /api/scenes/:id/duplicate - Duplicate a scene
router.post('/:id/duplicate', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;

  // Fetch the original scene
  db.get('SELECT * FROM scenes WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching scene to duplicate:', err);
      return res.status(500).json({ error: 'Failed to duplicate scene' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    const suffix = ' (Copy)';
    const newTitle = (row.title + suffix).slice(0, 200);
    const sql = 'INSERT INTO scenes (title, description, tags) VALUES (?, ?, ?)';

    db.run(sql, [newTitle, row.description, row.tags || ''], function(insertErr) {
      if (insertErr) {
        console.error('Error creating duplicated scene:', insertErr);
        return res.status(500).json({ error: 'Failed to create duplicated scene' });
      }

      // Fetch the created duplicated scene
      db.get('SELECT * FROM scenes WHERE id = ?', [this.lastID], (fetchErr, newRow) => {
        if (fetchErr) {
          console.error('Error fetching duplicated scene:', fetchErr);
          return res.status(500).json({ error: 'Duplicated scene created but failed to fetch' });
        }
        res.status(201).json(newRow);
      });
    });
  });
});

module.exports = router;
