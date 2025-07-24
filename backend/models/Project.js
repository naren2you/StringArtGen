const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  originalImage: {
    type: String,
    required: true
  },
  generatedImage: {
    type: String
  },
  settings: {
    nailCount: {
      type: Number,
      required: true,
      min: 20,
      max: 200
    },
    stringCount: {
      type: Number,
      required: true,
      min: 100,
      max: 2000
    },
    algorithm: {
      type: String,
      enum: ['greedy', 'optimized', 'advanced'],
      default: 'optimized'
    },
    stringColor: {
      type: String,
      default: '#000000'
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    stringThickness: {
      type: Number,
      min: 1,
      max: 5,
      default: 2
    },
    opacity: {
      type: Number,
      min: 0.1,
      max: 1,
      default: 0.8
    },
    contrast: {
      type: Number,
      min: 0,
      max: 2,
      default: 1.0
    },
    brightness: {
      type: Number,
      min: 0,
      max: 2,
      default: 1.0
    },
    noiseReduction: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.2
    },
    showNails: {
      type: Boolean,
      default: true
    },
    autoOptimize: {
      type: Boolean,
      default: true
    }
  },
  result: {
    nailCount: {
      type: Number,
      required: true
    },
    stringCount: {
      type: Number,
      required: true
    },
    generationTime: {
      type: Number,
      required: true
    },
    fileSize: {
      type: String,
      required: true
    },
    nailPositions: [{
      x: Number,
      y: Number,
      index: Number
    }],
    stringPaths: [{
      from: Number,
      to: Number,
      order: Number
    }],
    canvasWidth: {
      type: Number,
      required: true
    },
    canvasHeight: {
      type: Number,
      required: true
    },
    centerX: {
      type: Number,
      required: true
    },
    centerY: {
      type: Number,
      required: true
    },
    radius: {
      type: Number,
      required: true
    }
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  shareUrl: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Index for better query performance
projectSchema.index({ userId: 1, createdAt: -1 });
projectSchema.index({ isPublic: 1, createdAt: -1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ shareUrl: 1 });

// Virtual for like count
projectSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Method to generate share URL
projectSchema.methods.generateShareUrl = function() {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(this._id.toString() + Date.now()).digest('hex');
  this.shareUrl = hash.substring(0, 8);
  return this.shareUrl;
};

// Method to increment views
projectSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Static method to get public projects
projectSchema.statics.getPublicProjects = function(limit = 20, skip = 0) {
  return this.find({ isPublic: true })
    .populate('userId', 'username')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get user projects
projectSchema.statics.getUserProjects = function(userId, limit = 20, skip = 0) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to search projects
projectSchema.statics.searchProjects = function(query, limit = 20, skip = 0) {
  return this.find({
    $and: [
      { isPublic: true },
      {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  })
  .populate('userId', 'username')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Static method to get project statistics
projectSchema.statics.getStats = function(userId = null) {
  const match = userId ? { userId } : {};
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalProjects: { $sum: 1 },
        totalViews: { $sum: '$views' },
        totalLikes: { $sum: { $size: '$likes' } },
        avgGenerationTime: { $avg: '$result.generationTime' },
        avgNailCount: { $avg: '$settings.nailCount' },
        avgStringCount: { $avg: '$settings.stringCount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Project', projectSchema); 