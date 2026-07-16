const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const authMiddleware = require('../middleware/auth');

// Добавление вопроса к квизу
router.post('/add', authMiddleware, async (req, res) => {
  try {
    let { 
      quizId, 
      type, 
      questionText, 
      imageUrl, 
      options, 
      correctAnswer,
      points,
      order 
    } = req.body;

    // Проверка существования квиза и прав
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Квиз не найден' });
    }

    if (quiz.organizerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Нет прав на добавление вопросов' });
    }

    if (quiz.status === 'active') {
      return res.status(400).json({ error: 'Нельзя изменять активный квиз' });
    }

    // Проверка типа вопроса и валидация
    if (type === 'text' && !correctAnswer) {
      return res.status(400).json({ error: 'Для текстового вопроса требуется правильный ответ' });
    }

    if (type === 'single_choice' || type === 'multiple_choice'){
      if(!options || options.length < 2) {
        return res.status(400).json({ error: 'Для вопроса с выбором требуется минимум 2 варианта' });
      }
      console.log("saving correct answer");
      correctAnswer = JSON.stringify(options.filter(opt => opt.isCorrect).map(opt => opt.text).sort());
      console.log(correctAnswer)
    }


    const question = new Question({
      quizId,
      type,
      questionText,
      imageUrl,
      options: options || [],
      correctAnswer,
      points: points || 10,
      order: order || quiz.questions.length
    });

    console.log("saved correct answer for question " + question.questionText + ": " + question.correctAnswer);

    await question.save();

    // Добавляем вопрос в квиз
    quiz.questions.push(question._id);
    await quiz.save();

    res.status(201).json({
      success: true,
      question: {
        id: question._id,
        type: question.type,
        questionText: question.questionText,
        imageUrl: question.imageUrl,
        options: question.options,
        points: question.points,
        order: question.order
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение всех вопросов квиза
router.get('/quiz/:quizId', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Квиз не найден' });
    }

    // Проверка доступа для неактивных квизов
    if (quiz.organizerId.toString() !== req.userId && quiz.status !== 'active') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const questions = await Question.find({ quizId: req.params.quizId })
      .sort({ order: 1 });

    res.json({
      success: true,
      questions: questions.map(q => ({
        id: q._id,
        type: q.type,
        questionText: q.questionText,
        imageUrl: q.imageUrl,
        options: q.options,
        points: q.points,
        order: q.order
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновление вопроса
router.put('/:questionId', authMiddleware, async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    if (!question) {
      return res.status(404).json({ error: 'Вопрос не найден' });
    }

    const quiz = await Quiz.findById(question.quizId);
    if (quiz.organizerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Нет прав на редактирование' });
    }

    if (quiz.status === 'active') {
      return res.status(400).json({ error: 'Нельзя изменять активный квиз' });
    }

    const { questionText, imageUrl, options, correctAnswer, points, order } = req.body;
    
    question.questionText = questionText || question.questionText;
    question.imageUrl = imageUrl || question.imageUrl;
    question.options = options || question.options;
    question.correctAnswer = correctAnswer || question.correctAnswer;
    question.points = points || question.points;
    question.order = order !== undefined ? order : question.order;

    await question.save();

    res.json({
      success: true,
      question: {
        id: question._id,
        type: question.type,
        questionText: question.questionText,
        imageUrl: question.imageUrl,
        options: question.options,
        points: question.points,
        order: question.order
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удаление вопроса
router.delete('/:questionId', authMiddleware, async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    if (!question) {
      return res.status(404).json({ error: 'Вопрос не найден' });
    }

    const quiz = await Quiz.findById(question.quizId);
    if (quiz.organizerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Нет прав на удаление' });
    }

    if (quiz.status === 'active') {
      return res.status(400).json({ error: 'Нельзя изменять активный квиз' });
    }

    // Удаляем вопрос из квиза
    quiz.questions = quiz.questions.filter(q => q.toString() !== question._id.toString());
    await quiz.save();

    await question.deleteOne();

    res.json({
      success: true,
      message: 'Вопрос успешно удален'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Массовое добавление вопросов (для импорта)
router.post('/bulk-add', authMiddleware, async (req, res) => {
  try {
    const { quizId, questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Требуется массив вопросов' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Квиз не найден' });
    }

    if (quiz.organizerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Нет прав' });
    }

    if (quiz.status === 'active') {
      return res.status(400).json({ error: 'Нельзя изменять активный квиз' });
    }

    const createdQuestions = [];
    let currentOrder = quiz.questions.length;

    for (const q of questions) {
      const question = new Question({
        quizId,
        type: q.type || 'text',
        questionText: q.questionText,
        imageUrl: q.imageUrl,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        points: q.points || 10,
        order: currentOrder++
      });

      await question.save();
      createdQuestions.push(question._id);
    }

    // Добавляем все вопросы в квиз
    quiz.questions.push(...createdQuestions);
    await quiz.save();

    res.status(201).json({
      success: true,
      count: createdQuestions.length,
      message: `Добавлено ${createdQuestions.length} вопросов`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;