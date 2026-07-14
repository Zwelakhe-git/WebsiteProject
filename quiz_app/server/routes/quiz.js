const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Result = require('../models/Result');
const authMiddleware = require('../middleware/auth');

// Создание нового квиза
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, timeLimit } = req.body;
    
    const quiz = new Quiz({
      title,
      description,
      category,
      timeLimit: timeLimit || 30,
      organizerId: req.userId,
      status: 'draft'
    });

    await quiz.save();
    
    res.status(201).json({
      success: true,
      quiz: {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        timeLimit: quiz.timeLimit,
        status: quiz.status,
        roomCode: quiz.roomCode
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение всех квизов организатора
router.get('/my-quizzes', authMiddleware, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ organizerId: req.userId })
      .populate('questions')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      quizzes: quizzes.map(quiz => ({
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        status: quiz.status,
        questionsCount: quiz.questions.length,
        participantsCount: quiz.participants.length,
        roomCode: quiz.roomCode,
        createdAt: quiz.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение квиза по ID
router.get('/:quizId', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId)
      .populate('questions')
      .populate('organizerId', 'username email')
      .populate('participants', 'username email');
    
    if (!quiz) {
      return res.status(404).json({ error: 'Квиз не найден' });
    }

    // Проверка доступа
    if (quiz.organizerId._id.toString() !== req.userId && quiz.status !== 'active') {
      //return res.status(403).json({ error: 'Доступ раз' });
    }

    res.json({
      success: true,
      quiz: {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        timeLimit: quiz.timeLimit,
        status: quiz.status,
        roomCode: quiz.roomCode,
        organizer: quiz.organizerId.username,
        questions: quiz.questions.map(q => ({
          id: q._id,
          type: q.type,
          questionText: q.questionText,
          imageUrl: q.imageUrl,
          options: q.options,
          points: q.points,
          order: q.order
        })),
        participants: quiz.participants,
        startTime: quiz.startTime,
        endTime: quiz.endTime
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновление квиза
router.put('/:quizId', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Квиз не найден' });
    }

    if (quiz.organizerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Нет прав на редактирование' });
    }

    if (quiz.status === 'active') {
      return res.status(400).json({ error: 'Нельзя редактировать активный квиз' });
    }

    const { title, description, category, timeLimit } = req.body;
    quiz.title = title || quiz.title;
    quiz.description = description || quiz.description;
    quiz.category = category || quiz.category;
    quiz.timeLimit = timeLimit || quiz.timeLimit;

    await quiz.save();
    
    res.json({
      success: true,
      quiz: {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        timeLimit: quiz.timeLimit,
        status: quiz.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удаление квиза
router.delete('/:quizId', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Квиз не найден' });
    }

    if (quiz.organizerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Нет прав на удаление' });
    }

    if (quiz.status === 'active') {
      return res.status(400).json({ error: 'Нельзя удалить активный квиз' });
    }

    // Удаляем все вопросы
    await Question.deleteMany({ quizId: quiz._id });
    // Удаляем результаты
    await Result.deleteMany({ quizId: quiz._id });
    // Удаляем квиз
    await quiz.deleteOne();
    
    res.json({
      success: true,
      message: 'Квиз успешно удален'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// routes/quiz.js - добавляем новый маршрут
// Получение результатов квиза
router.get('/:quizId/results', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Квиз не найден' });
    }

    // Проверяем доступ
    const isOrganizer = quiz.organizerId.toString() === req.userId;
    const isParticipant = quiz.participants?.includes(req.userId);

    if (!isOrganizer && !isParticipant) {
      //return res.status(403).json({ error: 'Доступ запрещен' });
    }

    // Получаем результаты
    const results = await Result.find({ quizId: quiz._id })
      .populate('userId', 'username email')
      .sort({ score: -1 });

    res.json({
      success: true,
      results: results.map(r => ({
        id: r._id,
        userId: r.userId,
        score: r.score,
        answers: r.answers,
        timeTaken: r.timeTaken,
        completedAt: r.completedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;