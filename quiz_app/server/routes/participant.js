// routes/participant.js - создаем новый файл
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Result = require('../models/Result');
const Quiz = require('../models/Quiz');
const User = require('../models/User');

// Получение истории участника
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Получаем пользователя со статистикой
    const user = await User.findById(userId);
    
    // Получаем все результаты пользователя
    const results = await Result.find({ userId })
      .populate('quizId', 'title category')
      .sort({ completedAt: -1 });
    
    if (!results || results.length === 0) {
      return res.json({
        success: true,
        history: [],
        stats: {
          totalQuizzes: 0,
          totalPoints: 0,
          averageScore: 0,
          bestRank: 0,
        },
        message: 'Нет пройденных квизов'
      });
    }

    // Формируем историю
    const history = await Promise.all(results.map(async (result) => {
      const quiz = await Quiz.findById(result.quizId);
      
      // Получаем общее количество участников для этого квиза
      const allResults = await Result.find({ quizId: result.quizId });
      const totalParticipants = allResults.length;
      
      // Находим место пользователя
      const sortedResults = allResults.sort((a, b) => b.score - a.score);
      const rank = sortedResults.findIndex(r => r.userId.toString() === userId) + 1;
      
      // Подсчет правильных ответов
      const correctAnswers = result.answers?.filter(a => a.isCorrect).length || 0;
      
      return {
        id: result._id,
        quizId: quiz?._id,
        title: quiz?.title || 'Квиз',
        category: quiz?.category || 'Разное',
        date: result.completedAt,
        score: result.score,
        totalQuestions: quiz?.questions?.length || 0,
        correctAnswers: correctAnswers,
        rank: rank > 0 ? rank : totalParticipants + 1,
        totalParticipants: totalParticipants,
        isCompleted: true,
      };
    }));

    // Находим лучший результат пользователя
    let bestRank = Infinity;
    history.forEach(h => {
      if (h.rank < bestRank) bestRank = h.rank;
    });
    if (bestRank === Infinity) bestRank = 0;

    res.json({
      success: true,
      history,
      stats: {
        totalQuizzes: user?.totalQuizzesPlayed || 0,
        totalPoints: user?.totalPoints || 0,
        averageScore: user?.averageScore || 0,
        bestRank: bestRank,
      }
    });
    
  } catch (error) {
    console.error('Error getting participant history:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;