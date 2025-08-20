const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please add a username'],
    unique: true,
    trim: true,
    maxlength: [50, 'Username cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  firstName: {
    type: String,
    required: [true, 'Please add a first name'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Please add a last name'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  learningPreferences: {
    learningStyle: {
      type: String,
      enum: ['visual', 'auditory', 'kinesthetic', 'reading'],
      default: 'visual'
    },
    difficultyPreference: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    }
  },
  studyStats: {
    totalStudyTime: {
      type: Number,
      default: 0 // in minutes
    },
    totalCoursesCompleted: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    experiencePoints: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    },
    badges: [{
      type: String
    }]
  },
  settings: {
    notificationsEnabled: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    studyReminders: {
      type: Boolean,
      default: true
    },
    privacyLevel: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public'
    }
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add experience points and handle leveling up
userSchema.methods.addExperience = function (points) {
  this.studyStats.experiencePoints += points;
  
  // Calculate new level (simple formula: level = sqrt(xp/100) + 1)
  const newLevel = Math.floor(Math.sqrt(this.studyStats.experiencePoints / 100)) + 1;
  
  if (newLevel > this.studyStats.level) {
    this.studyStats.level = newLevel;
    // Add level up badge
    if (!this.studyStats.badges.includes('level_up')) {
      this.studyStats.badges.push('level_up');
    }
  }
  
  return this.save();
};

// Update study streak
userSchema.methods.updateStreak = function () {
  const today = new Date().toDateString();
  const lastStudy = this.lastLogin ? new Date(this.lastLogin).toDateString() : null;
  
  if (lastStudy) {
    const daysDiff = Math.floor((new Date(today) - new Date(lastStudy)) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) { // Consecutive day
      this.studyStats.currentStreak += 1;
    } else if (daysDiff > 1) { // Streak broken
      this.studyStats.currentStreak = 1;
    }
    // If daysDiff === 0, same day, don't change streak
  } else {
    this.studyStats.currentStreak = 1;
  }
  
  if (this.studyStats.currentStreak > this.studyStats.longestStreak) {
    this.studyStats.longestStreak = this.studyStats.currentStreak;
  }
  
  this.lastLogin = new Date();
  return this.save();
};

// Add badge
userSchema.methods.addBadge = function (badgeName) {
  if (!this.studyStats.badges.includes(badgeName)) {
    this.studyStats.badges.push(badgeName);
    return this.save();
  }
  return this;
};

// Get study statistics
userSchema.methods.getStudyStats = function () {
  return {
    totalStudyTime: this.studyStats.totalStudyTime,
    totalCoursesCompleted: this.studyStats.totalCoursesCompleted,
    currentStreak: this.studyStats.currentStreak,
    longestStreak: this.studyStats.longestStreak,
    experiencePoints: this.studyStats.experiencePoints,
    level: this.studyStats.level,
    badges: this.studyStats.badges
  };
};

module.exports = mongoose.model('User', userSchema); 