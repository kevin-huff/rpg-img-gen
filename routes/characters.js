const express = require('express');
const { getDatabase } = require('../db/database');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const characterSchema = Joi.object({
  name: Joi.string().required().max(100),
  description: Joi.string().required().max(1000),
  appearance: Joi.string().allow('').max(1000),
  tags: Joi.string().allow('').max(500)
});

const updateCharacterSchema = Joi.object({
  name: Joi.string().max(100),
  description: Joi.string().max(1000),
  appearance: Joi.string().allow('').max(1000),
  tags: Joi.string().allow('').max(500)
});

// GET /api/characters - List all characters
router.get('/', (req, res) => {
  const db = getDatabase();
  const { search, limit = 50, offset = 0 } = req.query;
  
  let sql = 'SELECT * FROM characters';
  let params = [];
  
  if (search) {
    sql += ' WHERE name LIKE ? OR description LIKE ? OR tags LIKE ?';
    const searchParam = `%${search}%`;
    params = [searchParam, searchParam, searchParam];
  }
  
  sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error fetching characters:', err);
      return res.status(500).json({ error: 'Failed to fetch characters' });
    }
    res.json(rows);
  });
});

// GET /api/characters/:id - Get specific character
router.get('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  db.get('SELECT * FROM characters WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching character:', err);
      return res.status(500).json({ error: 'Failed to fetch character' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    res.json(row);
  });
});

// POST /api/characters - Create new character
router.post('/', (req, res) => {
  const { error, value } = characterSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  const db = getDatabase();
  const { name, description, appearance, tags } = value;
  
  const sql = 'INSERT INTO characters (name, description, appearance, tags) VALUES (?, ?, ?, ?)';
  
  db.run(sql, [name, description, appearance || '', tags || ''], function(err) {
    if (err) {
      console.error('Error creating character:', err);
      return res.status(500).json({ error: 'Failed to create character' });
    }
    
    // Fetch the created character
    db.get('SELECT * FROM characters WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        console.error('Error fetching created character:', err);
        return res.status(500).json({ error: 'Character created but failed to fetch' });
      }
      
      res.status(201).json(row);
    });
  });
});

// PUT /api/characters/:id - Update character
router.put('/:id', (req, res) => {
  const { error, value } = updateCharacterSchema.validate(req.body);
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
  
  const sql = `UPDATE characters SET ${updates.join(', ')} WHERE id = ?`;
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error('Error updating character:', err);
      return res.status(500).json({ error: 'Failed to update character' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    // Fetch updated character
    db.get('SELECT * FROM characters WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error fetching updated character:', err);
        return res.status(500).json({ error: 'Character updated but failed to fetch' });
      }
      
      res.json(row);
    });
  });
});

// DELETE /api/characters/:id - Delete character
router.delete('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  db.run('DELETE FROM characters WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting character:', err);
      return res.status(500).json({ error: 'Failed to delete character' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    res.json({ message: 'Character deleted successfully' });
  });
});

module.exports = router;
