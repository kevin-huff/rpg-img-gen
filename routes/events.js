const express = require('express');
const Joi = require('joi');

const { getDatabase } = require('../db/database');

const router = express.Router();

const eventSchema = Joi.object({
  description: Joi.string().max(500).required(),
  type: Joi.string().allow('').max(100).default('action'),
  tags: Joi.string().allow('').max(200).default('')
});

router.get('/', (req, res) => {
  const db = getDatabase();
  const { limit = 100, offset = 0, search } = req.query;

  let sql = 'SELECT * FROM events';
  const params = [];

  if (search) {
    sql += ' WHERE description LIKE ? OR tags LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error fetching events:', err);
      return res.status(500).json({ error: 'Failed to fetch events' });
    }

    res.json(rows || []);
  });
});

router.post('/', (req, res) => {
  const db = getDatabase();
  const { error, value } = eventSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { description, type, tags } = value;

  const sql = `
    INSERT INTO events (description, type, tags)
    VALUES (?, ?, ?)
  `;

  db.run(sql, [description, type || 'action', tags || ''], function(err) {
    if (err) {
      console.error('Error creating event:', err);
      return res.status(500).json({ error: 'Failed to create event' });
    }

    res.status(201).json({
      id: this.lastID,
      description,
      type: type || 'action',
      tags: tags || '',
      created_at: new Date().toISOString()
    });
  });
});

module.exports = router;
