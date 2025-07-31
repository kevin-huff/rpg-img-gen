const express = require('express');
const { getDatabase } = require('../db/database');
const Joi = require('joi');

const router = express.Router();

// Validation schema
const templateSchema = Joi.object({
  title: Joi.string().allow('').max(200),
  sceneId: Joi.number().integer().allow(null),
  characterIds: Joi.array().items(Joi.number().integer()).default([]),
  eventDescriptions: Joi.array().items(Joi.string().max(500)).default([]),
  aiStyle: Joi.string().allow('').max(200).default(''),
  customPrompt: Joi.string().allow('').max(1000).default('')
});

// GET /api/templates - List all templates
router.get('/', (req, res) => {
  const db = getDatabase();
  const { limit = 20, offset = 0 } = req.query;
  
  const sql = `
    SELECT t.*, s.title as scene_title 
    FROM templates t 
    LEFT JOIN scenes s ON t.scene_id = s.id 
    ORDER BY t.created_at DESC 
    LIMIT ? OFFSET ?
  `;
  
  db.all(sql, [parseInt(limit), parseInt(offset)], (err, rows) => {
    if (err) {
      console.error('Error fetching templates:', err);
      return res.status(500).json({ error: 'Failed to fetch templates' });
    }
    res.json(rows);
  });
});

// GET /api/templates/:id - Get specific template
router.get('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  const sql = `
    SELECT t.*, s.title as scene_title, s.description as scene_description
    FROM templates t 
    LEFT JOIN scenes s ON t.scene_id = s.id 
    WHERE t.id = ?
  `;
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error('Error fetching template:', err);
      return res.status(500).json({ error: 'Failed to fetch template' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(row);
  });
});

// POST /api/templates/generate - Generate new template
router.post('/generate', async (req, res) => {
  const { error, value } = templateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  const db = getDatabase();
  const { title, sceneId, characterIds, eventDescriptions, aiStyle, customPrompt } = value;
  
  try {
    // Fetch scene data if provided
    let sceneData = null;
    if (sceneId) {
      sceneData = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM scenes WHERE id = ?', [sceneId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }
    
    // Fetch character data if provided
    let charactersData = [];
    if (characterIds.length > 0) {
      const placeholders = characterIds.map(() => '?').join(',');
      charactersData = await new Promise((resolve, reject) => {
        db.all(`SELECT * FROM characters WHERE id IN (${placeholders})`, characterIds, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
    
    // Generate the template text
    let templateText = '';
    
    // Add custom prompt if provided
    if (customPrompt) {
      templateText += customPrompt + '\n\n';
    }
    
    // Add scene information
    if (sceneData) {
      templateText += `Scene: ${sceneData.title}\n`;
      templateText += `${sceneData.description}\n\n`;
    }
    
    // Add character information
    if (charactersData.length > 0) {
      templateText += 'Characters:\n';
      charactersData.forEach(char => {
        templateText += `- ${char.name}: ${char.description}`;
        if (char.appearance) {
          templateText += ` (Appearance: ${char.appearance})`;
        }
        templateText += '\n';
      });
      templateText += '\n';
    }
    
    // Add events/actions
    if (eventDescriptions.length > 0) {
      templateText += 'Events/Actions:\n';
      eventDescriptions.forEach((event, index) => {
        templateText += `${index + 1}. ${event}\n`;
      });
      templateText += '\n';
    }
    
    // Add AI style guidance
    if (aiStyle) {
      templateText += `Style: ${aiStyle}\n`;
    }
    
    // Clean up the template
    templateText = templateText.trim();
    
    if (!templateText) {
      return res.status(400).json({ error: 'Generated template is empty. Please provide some content.' });
    }
    
    // Save the template to database
    const insertSql = `
      INSERT INTO templates (title, template_text, scene_id, character_ids, ai_style) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    db.run(insertSql, [
      title || `Template ${new Date().toISOString()}`,
      templateText,
      sceneId || null,
      JSON.stringify(characterIds),
      aiStyle || ''
    ], function(err) {
      if (err) {
        console.error('Error saving template:', err);
        return res.status(500).json({ error: 'Failed to save template' });
      }
      
      const templateId = this.lastID;
      
      // Emit socket event for real-time updates
      if (req.io) {
        req.io.emit('template-generated', {
          id: templateId,
          title: title || `Template ${new Date().toISOString()}`,
          templateText,
          sceneData,
          charactersData,
          timestamp: new Date().toISOString()
        });
      }
      
      res.status(201).json({
        id: templateId,
        title: title || `Template ${new Date().toISOString()}`,
        templateText,
        sceneData,
        charactersData,
        eventDescriptions,
        aiStyle
      });
    });
    
  } catch (err) {
    console.error('Error generating template:', err);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// DELETE /api/templates/:id - Delete template
router.delete('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  db.run('DELETE FROM templates WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting template:', err);
      return res.status(500).json({ error: 'Failed to delete template' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json({ message: 'Template deleted successfully' });
  });
});

module.exports = router;
