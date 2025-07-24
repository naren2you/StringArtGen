const mongoose = require('mongoose');

const stringArtSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  originalImage: {
    filename: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    dimensions: {
      width: {
        type: Number,
        required: true
      },
      height: {
        type: Number,
        required: true
      }
    }
  },
  settings: {
    nails: {
      type: Number,
      required: true,
      min: [50, 'Minimum 50 nails required'],
      max: [512, 'Maximum 512 nails allowed']
    },
    strings: {
      type: Number,
      required: true,
      min: [100, 'Minimum 100 strings required'],
      max: [3000, 'Maximum 3000 strings allowed']
    },
    algorithm: {
      type: String,
      enum: ['greedy', 'genetic', 'hybrid'],
      default: 'greedy'
    },
    color: {
      type: String,
      enum: ['black', 'white', 'custom'],
      default: 'black'
    },
    customColor: {
      type: String,
      default: null
    },
    blurRadius: {
      type: Number,
      default: 1,
      min: [0, 'Blur radius cannot be negative'],
      max: [5, 'Blur radius cannot exceed 5']
    },
    contrast: {
      type: Number,
      default: 1,
      min: [0.1, 'Contrast must be at least 0.1'],
      max: [3, 'Contrast cannot exceed 3']
    }
  },
  coordinates: [{
    from: {
      type: Number,
      required: true,
      min: [0, 'Nail index cannot be negative']
    },
    to: {
      type: Number,
      required: true,
      min: [0, 'Nail index cannot be negative']
    },
    order: {
      type: Number,
      required: true
    }
  }],
  preview: {
    data: {
      type: String, // Base64 encoded image
      required: true
    },
    format: {
      type: String,
      enum: ['png', 'jpeg', 'webp'],
      default: 'png'
    }
  },
  stats: {
    generationTime: {
      type: Number, // in milliseconds
      required: true
    },
    quality: {
      type: Number, // 0-100 score
      min: [0, 'Quality score cannot be negative'],
      max: [100, 'Quality score cannot exceed 100']
    },
    stringEfficiency: {
      type: Number, // percentage of strings used effectively
      min: [0, 'Efficiency cannot be negative'],
      max: [100, 'Efficiency cannot exceed 100']
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  downloads: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed', 'cancelled'],
    default: 'processing'
  },
  error: {
    message: String,
    code: String,
    timestamp: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total coordinates
stringArtSchema.virtual('totalCoordinates').get(function() {
  return this.coordinates.length;
});

// Virtual for completion percentage
stringArtSchema.virtual('completionPercentage').get(function() {
  if (this.status === 'completed') return 100;
  if (this.status === 'failed' || this.status === 'cancelled') return 0;
  return Math.min((this.coordinates.length / this.settings.strings) * 100, 99);
});

// Virtual for estimated time remaining
stringArtSchema.virtual('estimatedTimeRemaining').get(function() {
  if (this.status !== 'processing') return 0;
  const completed = this.coordinates.length;
  const total = this.settings.strings;
  const avgTimePerString = this.stats.generationTime / completed;
  return Math.round((total - completed) * avgTimePerString);
});

// Indexes for better query performance
stringArtSchema.index({ user: 1, createdAt: -1 });
stringArtSchema.index({ status: 1 });
stringArtSchema.index({ isPublic: 1, createdAt: -1 });
stringArtSchema.index({ tags: 1 });
stringArtSchema.index({ 'settings.nails': 1, 'settings.strings': 1 });

// Pre-save middleware to update user stats
stringArtSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'completed') {
    try {
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(this.user, {
        $inc: {
          'stats.projectsCreated': 1,
          'stats.totalStrings': this.coordinates.length
        }
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }
  next();
});

// Instance method to get public data
stringArtSchema.methods.getPublicData = function() {
  const data = this.toObject();
  delete data.user;
  delete data.originalImage.path;
  delete data.error;
  return data;
};

// Instance method to increment views
stringArtSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Instance method to increment downloads
stringArtSchema.methods.incrementDownloads = function() {
  this.downloads += 1;
  return this.save();
};

// Static method to find by user
stringArtSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.isPublic !== undefined) {
    query.isPublic = options.isPublic;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to find public projects
stringArtSchema.statics.findPublic = function(options = {}) {
  return this.find({ isPublic: true, status: 'completed' })
    .populate('user', 'username firstName lastName avatar')
    .sort({ createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Static method to search projects
stringArtSchema.statics.search = function(searchTerm, options = {}) {
  const query = {
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ]
  };
  
  if (options.userId) {
    query.user = options.userId;
  }
  
  if (options.isPublic !== undefined) {
    query.isPublic = options.isPublic;
  }
  
  return this.find(query)
    .populate('user', 'username firstName lastName avatar')
    .sort({ createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

module.exports = mongoose.model('StringArt', stringArtSchema); 