const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');
const StringArt = require('../models/StringArt');
const StringArtService = require('../services/stringArtService');
const { auth } = require('../middleware/auth');

const router = express.Router();
const stringArtService = new StringArtService();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `stringart-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// @route   POST /api/stringart/generate
// @desc    Generate string art from uploaded image
// @access  Private
router.post('/generate', [
  auth,
  upload.single('image'),
  body('title')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('settings.nails')
    .isInt({ min: 50, max: 512 })
    .withMessage('Nails must be between 50 and 512'),
  body('settings.strings')
    .isInt({ min: 100, max: 3000 })
    .withMessage('Strings must be between 100 and 3000'),
  body('settings.algorithm')
    .isIn(['greedy', 'genetic', 'hybrid'])
    .withMessage('Algorithm must be greedy, genetic, or hybrid'),
  body('settings.color')
    .isIn(['black', 'white', 'custom'])
    .withMessage('Color must be black, white, or custom'),
  body('settings.customColor')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Custom color must be a valid hex color'),
  body('settings.blurRadius')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Blur radius must be between 0 and 5'),
  body('settings.contrast')
    .optional()
    .isFloat({ min: 0.1, max: 3 })
    .withMessage('Contrast must be between 0.1 and 3'),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Tags must be an array with maximum 10 items'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required',
        code: 'IMAGE_REQUIRED'
      });
    }

    const {
      title,
      description,
      settings,
      tags = [],
      isPublic = false
    } = req.body;

    // Set default settings if not provided
    const defaultSettings = {
      nails: 200,
      strings: 1000,
      algorithm: 'greedy',
      color: 'black',
      blurRadius: 1,
      contrast: 1.2,
      ...settings
    };

    // Generate string art
    const result = await stringArtService.generateStringArt(req.file.path, defaultSettings);

    // Create string art record
    const stringArt = new StringArt({
      user: req.user._id,
      title,
      description,
      originalImage: {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
        dimensions: result.settings.originalMetadata
      },
      settings: defaultSettings,
      coordinates: result.coordinates,
      preview: result.preview,
      stats: {
        generationTime: result.generationTime,
        quality: result.quality,
        stringEfficiency: result.quality.stringEfficiency
      },
      tags,
      isPublic,
      status: 'completed'
    });

    await stringArt.save();

    // Clean up uploaded file
    try {
      await fs.unlink(req.file.path);
    } catch (error) {
      console.warn('Failed to delete uploaded file:', error);
    }

    res.status(201).json({
      success: true,
      message: 'String art generated successfully',
      data: {
        stringArt: stringArt.getPublicData()
      }
    });
  } catch (error) {
    console.error('String art generation error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to delete uploaded file on error:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'String art generation failed',
      code: 'GENERATION_ERROR'
    });
  }
});

// @route   GET /api/stringart/:id
// @desc    Get string art by ID
// @access  Private (or public if isPublic is true)
router.get('/:id', async (req, res) => {
  try {
    const stringArt = await StringArt.findById(req.params.id)
      .populate('user', 'username firstName lastName avatar');

    if (!stringArt) {
      return res.status(404).json({
        success: false,
        message: 'String art not found',
        code: 'NOT_FOUND'
      });
    }

    // Check if user can access this string art
    if (!stringArt.isPublic && (!req.user || stringArt.user._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Increment views
    await stringArt.incrementViews();

    res.json({
      success: true,
      data: {
        stringArt: stringArt.getPublicData()
      }
    });
  } catch (error) {
    console.error('Get string art error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get string art',
      code: 'FETCH_ERROR'
    });
  }
});

// @route   PUT /api/stringart/:id
// @desc    Update string art
// @access  Private (owner only)
router.put('/:id', [
  auth,
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Tags must be an array with maximum 10 items'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('isFavorite')
    .optional()
    .isBoolean()
    .withMessage('isFavorite must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const stringArt = await StringArt.findById(req.params.id);

    if (!stringArt) {
      return res.status(404).json({
        success: false,
        message: 'String art not found',
        code: 'NOT_FOUND'
      });
    }

    // Check ownership
    if (stringArt.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    const updateData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.tags !== undefined) updateData.tags = req.body.tags;
    if (req.body.isPublic !== undefined) updateData.isPublic = req.body.isPublic;
    if (req.body.isFavorite !== undefined) updateData.isFavorite = req.body.isFavorite;

    const updatedStringArt = await StringArt.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'String art updated successfully',
      data: {
        stringArt: updatedStringArt.getPublicData()
      }
    });
  } catch (error) {
    console.error('Update string art error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update string art',
      code: 'UPDATE_ERROR'
    });
  }
});

// @route   DELETE /api/stringart/:id
// @desc    Delete string art
// @access  Private (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const stringArt = await StringArt.findById(req.params.id);

    if (!stringArt) {
      return res.status(404).json({
        success: false,
        message: 'String art not found',
        code: 'NOT_FOUND'
      });
    }

    // Check ownership
    if (stringArt.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Delete original image file if it exists
    if (stringArt.originalImage && stringArt.originalImage.path) {
      try {
        await fs.unlink(stringArt.originalImage.path);
      } catch (error) {
        console.warn('Failed to delete original image file:', error);
      }
    }

    await StringArt.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'String art deleted successfully'
    });
  } catch (error) {
    console.error('Delete string art error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete string art',
      code: 'DELETE_ERROR'
    });
  }
});

// @route   POST /api/stringart/:id/download
// @desc    Increment download count
// @access  Private (or public if isPublic is true)
router.post('/:id/download', async (req, res) => {
  try {
    const stringArt = await StringArt.findById(req.params.id);

    if (!stringArt) {
      return res.status(404).json({
        success: false,
        message: 'String art not found',
        code: 'NOT_FOUND'
      });
    }

    // Check if user can access this string art
    if (!stringArt.isPublic && (!req.user || stringArt.user.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Increment downloads
    await stringArt.incrementDownloads();

    res.json({
      success: true,
      message: 'Download count updated'
    });
  } catch (error) {
    console.error('Download increment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update download count',
      code: 'DOWNLOAD_ERROR'
    });
  }
});

module.exports = router; 