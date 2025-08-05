const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../db/database');

const router = express.Router();

// Railway-aware upload directory
let uploadDir = process.env.UPLOAD_DIR || './uploads';

// For Railway, ensure we use the persistent volume
if (process.env.RAILWAY_ENVIRONMENT) {
  uploadDir = '/app/data/uploads';
} else if (process.env.NODE_ENV === 'production' && !process.env.UPLOAD_DIR) {
  uploadDir = '/app/data/uploads';
}

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created upload directory: ${uploadDir}`);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueId}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// GET /api/images - List all images
router.get('/', (req, res) => {
  const db = getDatabase();
  const { limit = 20, offset = 0, active_only = false } = req.query;
  
  let sql = 'SELECT * FROM images';
  let params = [];
  
  if (active_only === 'true') {
    sql += ' WHERE is_active = 1';
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error fetching images:', err);
      return res.status(500).json({ error: 'Failed to fetch images' });
    }
    res.json(rows);
  });
});

// GET /api/images/active - Get currently active image
router.get('/active', (req, res) => {
  const db = getDatabase();
  
  db.get('SELECT * FROM images WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1', (err, row) => {
    if (err) {
      console.error('Error fetching active image:', err);
      return res.status(500).json({ error: 'Failed to fetch active image' });
    }
    
    res.json(row || null);
  });
});

// POST /api/images/upload - Upload new image
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }
  
  const db = getDatabase();
  const { originalname, filename } = req.file;
  const { templateId, setActive = true } = req.body;
  
  const url = `/uploads/${filename}`;
  
  // First, if setActive is true, deactivate all other images
  const deactivateOthers = setActive === 'true' || setActive === true;
  
  const processUpload = () => {
    const sql = 'INSERT INTO images (filename, original_name, url, template_id, is_active) VALUES (?, ?, ?, ?, ?)';
    const isActive = deactivateOthers ? 1 : 0;
    
    db.run(sql, [filename, originalname, url, templateId || null, isActive], function(err) {
      if (err) {
        console.error('Error saving image:', err);
        // Clean up uploaded file if database save fails
        fs.unlink(path.join(uploadDir, filename), () => {});
        return res.status(500).json({ error: 'Failed to save image' });
      }
      
      const imageData = {
        id: this.lastID,
        filename,
        original_name: originalname,
        url,
        template_id: templateId || null,
        is_active: isActive,
        created_at: new Date().toISOString()
      };
      
      // Emit socket event for real-time updates
      if (req.io) {
        req.io.to('overlay').emit('image-update', imageData);
        req.io.emit('image-uploaded', imageData);
      }
      
      res.status(201).json(imageData);
    });
  };
  
  if (deactivateOthers) {
    db.run('UPDATE images SET is_active = 0', (err) => {
      if (err) {
        console.error('Error deactivating other images:', err);
        return res.status(500).json({ error: 'Failed to update image status' });
      }
      processUpload();
    });
  } else {
    processUpload();
  }
});

// PUT /api/images/:id/activate - Set image as active
router.put('/:id/activate', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  // First deactivate all other images
  db.run('UPDATE images SET is_active = 0', (err) => {
    if (err) {
      console.error('Error deactivating images:', err);
      return res.status(500).json({ error: 'Failed to update image status' });
    }
    
    // Then activate the specified image
    db.run('UPDATE images SET is_active = 1 WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error activating image:', err);
        return res.status(500).json({ error: 'Failed to activate image' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      // Fetch the activated image
      db.get('SELECT * FROM images WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error fetching activated image:', err);
          return res.status(500).json({ error: 'Image activated but failed to fetch' });
        }
        
        // Emit socket event for real-time updates
        if (req.io) {
          req.io.to('overlay').emit('image-update', row);
        }
        
        res.json(row);
      });
    });
  });
});

// PUT /api/images/hide - Hide currently active image from overlay
router.put('/hide', (req, res) => {
  const db = getDatabase();
  
  // Deactivate all images (effectively hiding the overlay)
  db.run('UPDATE images SET is_active = 0', (err) => {
    if (err) {
      console.error('Error hiding images:', err);
      return res.status(500).json({ error: 'Failed to hide image' });
    }
    
    // Emit socket event to hide image on overlay
    if (req.io) {
      req.io.to('overlay').emit('image-update', null);
    }
    
    res.json({ message: 'Image hidden successfully' });
  });
});

// PUT /api/images/caption - Update caption for overlay
router.put('/caption', (req, res) => {
  const { caption } = req.body;
  
  // Emit socket event to update caption on overlay
  if (req.io) {
    req.io.to('overlay').emit('caption-update', { caption: caption || '' });
  }
  
  res.json({ message: 'Caption updated successfully', caption: caption || '' });
});

// DELETE /api/images/:id - Delete image
router.delete('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  // First get the image info to delete the file
  db.get('SELECT * FROM images WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching image for deletion:', err);
      return res.status(500).json({ error: 'Failed to fetch image' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Delete from database
    db.run('DELETE FROM images WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error deleting image from database:', err);
        return res.status(500).json({ error: 'Failed to delete image' });
      }
      
      // Delete physical file
      const filePath = path.join(uploadDir, row.filename);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting image file:', err);
          // Don't return error since database deletion succeeded
        }
      });
      
      // If this was the active image, emit update
      if (row.is_active && req.io) {
        req.io.to('overlay').emit('image-update', null);
      }
      
      res.json({ message: 'Image deleted successfully' });
    });
  });
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({ error: 'Only image files are allowed' });
  }
  
  next(error);
});

module.exports = router;
