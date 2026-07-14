const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['organizer', 'participant'],
    default: 'participant'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Статистика
  totalQuizzesPlayed: {
    type: Number,
    default: 0
  },
  totalQuizzesOrganized: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('User', UserSchema);