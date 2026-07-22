const express = require('express');
const { v4: uuidv4 } = require('uuid');
const galleryRepo = require('../repositories/galleryRepo');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../middleware/upload');
const { uploadFile, deleteFile } = require('../db/firebase');

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
    const uploaded = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'gallery'
    );

    const galleryData = {
      id,
      type: 'image',
      url: uploaded.url,
      thumbnail_url: uploaded.url,
      storage_path: uploaded.path,
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

    await deleteFile(existing.storage_path || existing.url);

    await galleryRepo.delete(req.params.id);
    res.json({ success: true, message: 'Gallery item deleted successfully' });
  } catch (err) {
    console.error('Delete gallery error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
