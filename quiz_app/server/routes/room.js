const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const authMiddleware = require('../middleware/auth');

// Генерация кода комнаты
const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Создание комнаты для квиза (запуск квиза)
router.post('/start/:quizId', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId)
      .populate('questions');
    
    if (!quiz) {
      return res.status(404).json({ error: 'Квиз не найден' });
    }

    if (quiz.organizerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Только организатор может запустить квиз' });
    }

    if (quiz.questions.length === 0) {
      return res.status(400).json({ error: 'Нельзя запустить квиз без вопросов' });
    }

    if (quiz.status === 'active') {
      return res.status(400).json({ error: 'Квиз уже запущен' });
    }

    // Генерируем уникальный код комнаты
    let roomCode = generateRoomCode();
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      const existing = await Quiz.findOne({ roomCode });
      if (!existing) {
        isUnique = true;
      } else {
        roomCode = generateRoomCode();
        attempts++;
      }
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Не удалось сгенерировать код комнаты' });
    }

    quiz.roomCode = roomCode;
    quiz.status = 'active';
    quiz.startTime = new Date();
    quiz.isActive = true;

    await quiz.save();

    res.json({
      success: true,
      roomCode: roomCode,
      quiz: {
        id: quiz._id,
        title: quiz.title,
        questionsCount: quiz.questions.length,
        timeLimit: quiz.timeLimit
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Проверка кода комнаты
router.post('/check', async (req, res) => {
  try {
    const { roomCode } = req.body;
    
    if (!roomCode) {
      return res.status(400).json({ error: 'Требуется код комнаты' });
    }

    const quiz = await Quiz.findOne({ 
      roomCode: roomCode.toUpperCase(),
      status: 'active'
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Комната не найдена или квиз не активен' });
    }

    // Проверяем, не завершился ли квиз
    if (quiz.endTime && new Date() > quiz.endTime) {
      quiz.status = 'completed';
      await quiz.save();
      return res.status(400).json({ error: 'Квиз уже завершен' });
    }

    res.json({
      success: true,
      quizId: quiz._id,
      title: quiz.title,
      organizer: quiz.organizerId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение информации о комнате
router.get('/:roomCode', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ 
      roomCode: req.params.roomCode.toUpperCase() 
    })
    .populate('organizerId', 'username')
    .populate('participants', 'username');

    if (!quiz) {
      return res.status(404).json({ error: 'Комната не найдена' });
    }

    res.json({
      success: true,
      room: {
        roomCode: quiz.roomCode,
        title: quiz.title,
        description: quiz.description,
        organizer: quiz.organizerId.username,
        status: quiz.status,
        participantsCount: quiz.participants.length,
        participants: quiz.participants.map(p => p.username),
        startTime: quiz.startTime,
        endTime: quiz.endTime
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Завершение квиза (закрытие комнаты)
router.post('/end/:roomCode', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ 
      roomCode: req.params.roomCode.toUpperCase() 
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Комната не найдена' });
    }

    if (quiz.organizerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Только организатор может завершить квиз' });
    }

    quiz.status = 'completed';
    quiz.endTime = new Date();
    quiz.isActive = false;
    await quiz.save();

    res.json({
      success: true,
      message: 'Квиз завершен'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;