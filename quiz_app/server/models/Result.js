const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    selectedOption: String,
    isCorrect: Boolean,
    timeSpent: Number
  }],
  completedAt: {
    type: Date,
    default: Date.now
  },
  timeTaken: {
    type: Number // общее время в секундах
  }
});

module.exports = mongoose.model('Result', ResultSchema);