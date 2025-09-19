const express = require('express');
const { getDatabase } = require('../db/database');
const Joi = require('joi');

const router = express.Router();

function safeJsonParse(value, fallback) {
  if (!value && value !== '') {
    return fallback;
  }

  try {
    return value ? JSON.parse(value) : fallback;
  } catch (err) {
    console.warn('Failed to parse JSON value from database:', err.message);
    return fallback;
  }
}

// Validation schema
const templateSchema = Joi.object({
  title: Joi.string().allow('').max(200),
  sceneId: Joi.number().integer().allow(null),
  characterIds: Joi.array().items(Joi.number().integer()).default([]),
  eventIds: Joi.array().items(Joi.number().integer()).default([]),
  eventDescriptions: Joi.array().items(Joi.string().max(500)).default([]),
  aiStyle: Joi.string().allow('').max(200).default(''),
  stylePreset: Joi.string().allow('').max(200).default(''),
  customPrompt: Joi.string().allow('').max(1000).default(''),
  composition: Joi.string().allow('').max(500).default(''),
  lighting: Joi.string().allow('').max(500).default(''),
  mood: Joi.string().allow('').max(500).default(''),
  camera: Joi.string().allow('').max(500).default(''),
  postProcessing: Joi.string().allow('').max(500).default(''),
  modifiers: Joi.array().items(Joi.string().max(200)).default([])
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

    const parsedRows = rows.map((row) => ({
      ...row,
      character_ids: safeJsonParse(row.character_ids, []),
      event_ids: safeJsonParse(row.event_ids, []),
      input_snapshot: safeJsonParse(row.input_snapshot, null)
    }));

    res.json(parsedRows);
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

    const parsedRow = {
      ...row,
      character_ids: safeJsonParse(row.character_ids, []),
      event_ids: safeJsonParse(row.event_ids, []),
      input_snapshot: safeJsonParse(row.input_snapshot, null)
    };

    res.json(parsedRow);
  });
});

// POST /api/templates/generate - Generate new template
router.post('/generate', async (req, res) => {
  const { error, value } = templateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  const db = getDatabase();
  const {
    title,
    sceneId,
    characterIds,
    eventIds,
    eventDescriptions,
    aiStyle,
    stylePreset,
    customPrompt,
    composition,
    lighting,
    mood,
    camera,
    postProcessing,
    modifiers
  } = value;
  
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
    
    // Fetch event data if provided
    let eventsData = [];
    if (eventIds.length > 0) {
      const placeholders = eventIds.map(() => '?').join(',');
      const eventRows = await new Promise((resolve, reject) => {
        db.all(`SELECT * FROM events WHERE id IN (${placeholders})`, eventIds, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      const eventMap = new Map(eventRows.map((event) => [event.id, event]));
      eventsData = eventIds
        .map((eventId) => eventMap.get(eventId))
        .filter(Boolean);
    }

    // Generate the template text
    let templateText = '';
    
    // Add custom prompt if provided
    if (customPrompt) {
      templateText += customPrompt + '\n\n';
    }

    // Add modifiers if provided
    if (modifiers.length > 0) {
      templateText += `Modifiers: ${modifiers.join(', ')}\n\n`;
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
    if (eventsData.length > 0 || eventDescriptions.length > 0) {
      templateText += 'Events/Actions:\n';
      let counter = 1;
      eventsData.forEach((event) => {
        templateText += `${counter}. ${event.description}`;
        if (event.tags) {
          templateText += ` (Tags: ${event.tags})`;
        }
        templateText += '\n';
        counter += 1;
      });
      eventDescriptions.forEach((event) => {
        templateText += `${counter}. ${event}\n`;
        counter += 1;
      });
      templateText += '\n';
    }

    const promptDetails = [
      { label: 'Composition', value: composition },
      { label: 'Lighting', value: lighting },
      { label: 'Mood', value: mood },
      { label: 'Camera', value: camera },
      { label: 'Post-Processing', value: postProcessing },
      { label: 'Style Preset', value: stylePreset },
      { label: 'AI Style', value: aiStyle }
    ];

    promptDetails.forEach(({ label, value }) => {
      if (value) {
        templateText += `${label}: ${value}\n`;
      }
    });

    // Clean up the template
    templateText = templateText.trim();
    
    if (!templateText) {
      return res.status(400).json({ error: 'Generated template is empty. Please provide some content.' });
    }
    
    // Save the template to database
    const insertSql = `
      INSERT INTO templates (title, template_text, scene_id, character_ids, event_ids, ai_style, input_snapshot) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const inputSnapshot = JSON.stringify({
      title: title || '',
      sceneId: sceneId || null,
      characterIds,
      eventIds,
      eventDescriptions,
      aiStyle,
      stylePreset,
      customPrompt,
      composition,
      lighting,
      mood,
      camera,
      postProcessing,
      modifiers
    });

    db.run(insertSql, [
      title || `Template ${new Date().toISOString()}`,
      templateText,
      sceneId || null,
      JSON.stringify(characterIds),
      JSON.stringify(eventIds),
      aiStyle || '',
      inputSnapshot
    ], function(err) {
      if (err) {
        console.error('Error saving template:', err);
        return res.status(500).json({ error: 'Failed to save template' });
      }
      
      const templateId = this.lastID;
      
      // Emit socket event for real-time updates
      const parsedSnapshot = JSON.parse(inputSnapshot);

      if (req.io) {
        req.io.emit('template-generated', {
          id: templateId,
          title: title || `Template ${new Date().toISOString()}`,
          templateText,
          sceneData,
          charactersData,
          eventsData,
          eventIds,
          inputSnapshot: parsedSnapshot,
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
        eventsData,
        eventIds,
        aiStyle,
        stylePreset,
        composition,
        lighting,
        mood,
        camera,
        postProcessing,
        modifiers,
        inputSnapshot: parsedSnapshot
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
