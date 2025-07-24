const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');

// @route   POST /api/projects
// @desc    Create a new string art project
// @access  Private
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      originalImage,
      generatedImage,
      settings,
      result,
      isPublic = false,
      tags = []
    } = req.body;

    // Validate required fields
    if (!title || !originalImage || !settings || !result) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, originalImage, settings, and result are required'
      });
    }

    // Create new project
    const project = new Project({
      userId: req.user?.id || null, // Handle case where no user is authenticated
      title,
      description,
      originalImage,
      generatedImage,
      settings,
      result,
      isPublic,
      tags
    });

    await project.save();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/projects
// @desc    Get user's projects
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const projects = await Project.getUserProjects(req.user.id, parseInt(limit), skip);
    const total = await Project.countDocuments({ userId: req.user.id });

    res.json({
      success: true,
      projects,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasMore: skip + projects.length < total
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/projects/public
// @desc    Get public projects
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const projects = await Project.getPublicProjects(parseInt(limit), skip);
    const total = await Project.countDocuments({ isPublic: true });

    res.json({
      success: true,
      projects,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasMore: skip + projects.length < total
      }
    });
  } catch (error) {
    console.error('Get public projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/projects/search
// @desc    Search public projects
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }

    const skip = (page - 1) * limit;
    const projects = await Project.searchProjects(q.trim(), parseInt(limit), skip);
    const total = await Project.countDocuments({
      $and: [
        { isPublic: true },
        {
          $or: [
            { title: { $regex: q.trim(), $options: 'i' } },
            { description: { $regex: q.trim(), $options: 'i' } },
            { tags: { $in: [new RegExp(q.trim(), 'i')] } }
          ]
        }
      ]
    });

    res.json({
      success: true,
      projects,
      query: q.trim(),
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasMore: skip + projects.length < total
      }
    });
  } catch (error) {
    console.error('Search projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private (if user's project) or Public (if public project)
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('userId', 'username');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user can access this project
    const isOwner = req.user && project.userId._id.toString() === req.user.id;
    const isPublic = project.isPublic;

    if (!isOwner && !isPublic) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Increment views if not the owner
    if (!isOwner) {
      await project.incrementViews();
    }

    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/projects/share/:shareUrl
// @desc    Get project by share URL
// @access  Public
router.get('/share/:shareUrl', async (req, res) => {
  try {
    const project = await Project.findOne({ shareUrl: req.params.shareUrl })
      .populate('userId', 'username');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Increment views
    await project.incrementViews();

    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Get shared project error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check ownership
    if (project.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this project'
      });
    }

    // Update fields
    const updateFields = ['title', 'description', 'isPublic', 'tags'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });

    await project.save();

    res.json({
      success: true,
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check ownership
    if (project.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this project'
      });
    }

    await Project.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/projects/:id/share
// @desc    Generate share URL for project
// @access  Private (owner only)
router.post('/:id/share', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check ownership
    if (project.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to share this project'
      });
    }

    // Generate share URL
    const shareUrl = project.generateShareUrl();
    await project.save();

    res.json({
      success: true,
      message: 'Share URL generated successfully',
      shareUrl: `${req.protocol}://${req.get('host')}/api/projects/share/${shareUrl}`
    });
  } catch (error) {
    console.error('Generate share URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/projects/:id/like
// @desc    Like/unlike a project
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const likeIndex = project.likes.indexOf(req.user.id);
    
    if (likeIndex > -1) {
      // Unlike
      project.likes.splice(likeIndex, 1);
    } else {
      // Like
      project.likes.push(req.user.id);
    }

    await project.save();

    res.json({
      success: true,
      message: likeIndex > -1 ? 'Project unliked' : 'Project liked',
      likeCount: project.likes.length,
      isLiked: likeIndex === -1
    });
  } catch (error) {
    console.error('Like project error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/projects/stats
// @desc    Get project statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Project.getStats(req.user.id);
    
    res.json({
      success: true,
      stats: stats[0] || {
        totalProjects: 0,
        totalViews: 0,
        totalLikes: 0,
        avgGenerationTime: 0,
        avgNailCount: 0,
        avgStringCount: 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router; 