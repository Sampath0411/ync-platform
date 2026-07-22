const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const galleryRepo = require('../repositories/galleryRepo');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../middleware/upload');
const config = require('../config/default');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const items = await galleryRepo.findAllOrdered();
    res.json({ success: true, data: items });
  } catch (err) {
    console.error('List gallery error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file is required' });
    }

    const { title, description } = req.body;
    const id = uuidv4();
    const url = `/uploads/${req.file.filename}`;
    const thumbnailUrl = `/uploads/${req.file.filename}`;

    const galleryData = {
      id,
      type: 'image',
      url,
      thumbnail_url: thumbnailUrl,
      title: title || null,
      description: description || null,
      uploaded_by: req.admin.id,
      created_at: new Date().toISOString(),
    };

    const item = await galleryRepo.create(galleryData);
    res.status(201).json({
      success: true,
      data: item,
      message: 'Image uploaded successfully',
    });
  } catch (err) {
    console.error('Upload gallery error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const existing = await galleryRepo.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }

    if (existing.url) {
      const filename = path.basename(existing.url);
      const filePath = path.join(config.UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await galleryRepo.delete(req.params.id);
    res.json({ success: true, message: 'Gallery item deleted successfully' });
  } catch (err) {
    console.error('Delete gallery error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
