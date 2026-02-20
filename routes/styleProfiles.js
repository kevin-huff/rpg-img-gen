const express = require('express');
const { getDatabase } = require('../db/database');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const styleProfileSchema = Joi.object({
  name: Joi.string().required().max(200),
  style_preset: Joi.string().allow('').max(500),
  composition: Joi.string().allow('').max(500),
  lighting: Joi.string().allow('').max(500),
  mood: Joi.string().allow('').max(500),
  camera: Joi.string().allow('').max(500),
  post_processing: Joi.string().allow('').max(500),
  ai_style: Joi.string().allow('').max(200),
});

const updateStyleProfileSchema = Joi.object({
  name: Joi.string().max(200),
  style_preset: Joi.string().allow('').max(500),
  composition: Joi.string().allow('').max(500),
  lighting: Joi.string().allow('').max(500),
  mood: Joi.string().allow('').max(500),
  camera: Joi.string().allow('').max(500),
  post_processing: Joi.string().allow('').max(500),
  ai_style: Joi.string().allow('').max(200),
});

// GET /api/style-profiles - List all style profiles
router.get('/', (req, res) => {
  const db = getDatabase();

  const sql = 'SELECT * FROM style_profiles ORDER BY is_default DESC, updated_at DESC';

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching style profiles:', err);
      return res.status(500).json({ error: 'Failed to fetch style profiles' });
    }
    res.json(rows);
  });
});

// GET /api/style-profiles/:id - Get specific style profile
router.get('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;

  db.get('SELECT * FROM style_profiles WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching style profile:', err);
      return res.status(500).json({ error: 'Failed to fetch style profile' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Style profile not found' });
    }

    res.json(row);
  });
});

// POST /api/style-profiles - Create new style profile
router.post('/', (req, res) => {
  const { error, value } = styleProfileSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const db = getDatabase();
  const { name, style_preset, composition, lighting, mood, camera, post_processing, ai_style } = value;

  const sql = `INSERT INTO style_profiles (name, style_preset, composition, lighting, mood, camera, post_processing, ai_style)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(sql, [name, style_preset || '', composition || '', lighting || '', mood || '', camera || '', post_processing || '', ai_style || ''], function(err) {
    if (err) {
      console.error('Error creating style profile:', err);
      return res.status(500).json({ error: 'Failed to create style profile' });
    }

    db.get('SELECT * FROM style_profiles WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        console.error('Error fetching created style profile:', err);
        return res.status(500).json({ error: 'Style profile created but failed to fetch' });
      }

      res.status(201).json(row);
    });
  });
});

// PUT /api/style-profiles/:id - Update style profile
router.put('/:id', (req, res) => {
  const { error, value } = updateStyleProfileSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const db = getDatabase();
  const { id } = req.params;

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

  const sql = `UPDATE style_profiles SET ${updates.join(', ')} WHERE id = ?`;

  db.run(sql, params, function(err) {
    if (err) {
      console.error('Error updating style profile:', err);
      return res.status(500).json({ error: 'Failed to update style profile' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Style profile not found' });
    }

    db.get('SELECT * FROM style_profiles WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error fetching updated style profile:', err);
        return res.status(500).json({ error: 'Style profile updated but failed to fetch' });
      }

      res.json(row);
    });
  });
});

// DELETE /api/style-profiles/:id - Delete style profile
router.delete('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;

  db.run('DELETE FROM style_profiles WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting style profile:', err);
      return res.status(500).json({ error: 'Failed to delete style profile' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Style profile not found' });
    }

    res.json({ message: 'Style profile deleted successfully' });
  });
});

// PUT /api/style-profiles/:id/set-default - Set as default profile
router.put('/:id/set-default', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;

  // First, unset all defaults
  db.run('UPDATE style_profiles SET is_default = 0, updated_at = CURRENT_TIMESTAMP', [], function(err) {
    if (err) {
      console.error('Error unsetting defaults:', err);
      return res.status(500).json({ error: 'Failed to update default profile' });
    }

    // Then set the new default
    db.run('UPDATE style_profiles SET is_default = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error setting default:', err);
        return res.status(500).json({ error: 'Failed to set default profile' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Style profile not found' });
      }

      db.get('SELECT * FROM style_profiles WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error fetching default style profile:', err);
          return res.status(500).json({ error: 'Default set but failed to fetch' });
        }

        res.json(row);
      });
    });
  });
});

module.exports = router;
