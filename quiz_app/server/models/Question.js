const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'single_choice', 'multiple_choice'],
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: {
    type: String
  },
  points: {
    type: Number,
    default: 10
  },
  order: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Question', QuestionSchema);