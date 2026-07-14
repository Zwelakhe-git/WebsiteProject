// socket.js
const Quiz = require('./models/Quiz');
const Question = require('./models/Question');
const Result = require('./models/Result');

// Хранилище комнат
const rooms = new Map();

// Функция для логирования состояния комнат
function logRoomsState() {
  console.log(`📊 Rooms state (${rooms.size} rooms):`);
  for (const [code, room] of rooms) {
    console.log(`  - ${code}: ${room.participants.size} participants, started: ${room.isGameStarted}, ended: ${room.isGameEnded}`);
  }
}

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('✅ New WebSocket connection:', socket.id);
    console.log('📡 Query params:', socket.handshake.query);

    const { roomCode, userId, username, role } = socket.handshake.query;

    if (!roomCode || !userId) {
      console.log('❌ Missing roomCode or userId');
      socket.emit('error', { message: 'Missing roomCode or userId' });
      socket.disconnect();
      return;
    }

    // Присоединение к комнате
    socket.on('join-room', async (data) => {
      console.log(`📡 join-room event from ${username}:`, data);
      logRoomsState();
      
      try {
        const quiz = await Quiz.findOne({ 
          roomCode: roomCode.toUpperCase(),
          status: 'active'
        });

        if (!quiz) {
          console.log('❌ Room not found or not active:', roomCode);
          socket.emit('error', { message: 'Комната не найдена или неактивна' });
          return;
        }

        // Инициализируем комнату, если её нет
        if (!rooms.has(roomCode)) {
          console.log(`🆕 Creating new room: ${roomCode}`);
          rooms.set(roomCode, {
            participants: new Map(),
            readyCount: 0,
            totalParticipants: 0,
            isGameStarted: false,
            isGameEnded: false,
            quizId: quiz._id.toString(),
            organizerId: quiz.organizerId.toString(),
            questions: [],
            currentQuestionIndex: -1,
            totalQuestions: 0,
          });
          console.log(`✅ Room ${roomCode} created`);
          logRoomsState();
        }

        const room = rooms.get(roomCode);
        
        // Проверяем, не присоединился ли уже пользователь
        if (!room.participants.has(userId)) {
          room.participants.set(userId, { 
            socketId: socket.id, 
            username, 
            role,
            isReady: false,
            score: 0,
            hasAnswered: false,
            userId: userId,
          });
          room.totalParticipants++;
          console.log(`👤 New participant ${username} added to room ${roomCode}`);
        } else {
          // Обновляем socketId при переподключении
          const participant = room.participants.get(userId);
          participant.socketId = socket.id;
          console.log(`🔄 Participant ${username} reconnected to room ${roomCode}`);
        }

        socket.join(roomCode);
        socket.userData = { userId, username, roomCode, role };

        console.log(`✅ User ${username} joined room ${roomCode}`);
        console.log(`📊 Room ${roomCode} has ${room.participants.size} participants`);
        logRoomsState();

        // Отправляем обновленный список участников
        sendParticipantsUpdate(io, roomCode);

        // Если игра уже началась, отправляем статус
        if (room.isGameStarted) {
          console.log(`🎮 Game already started for room ${roomCode}, sending quiz-started`);
          socket.emit('quiz-started');
        }

        // Если игра завершена, отправляем результаты
        if (room.isGameEnded) {
          console.log(`🏁 Game already ended for room ${roomCode}, sending results`);
          sendQuizResults(io, roomCode);
        }

        // Отправляем подтверждение
        socket.emit('joined-room', { 
          success: true, 
          roomCode,
          participants: Array.from(room.participants.values()).map(p => p.username)
        });

      } catch (error) {
        console.error('❌ Error in join-room:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Готовность игрока
    socket.on('player-ready', (data) => {
      console.log(`✅ Player ready event from ${data.userId} in ${roomCode}`);
      console.log(`🔍 Checking if room ${roomCode} exists...`);
      logRoomsState();
      
      if (!rooms.has(roomCode)) {
        console.log(`❌ Room ${roomCode} not found in rooms map!`);
        console.log(`📊 Available rooms:`, Array.from(rooms.keys()));
        socket.emit('error', { message: 'Комната не найдена' });
        return;
      }

      const room = rooms.get(roomCode);
      console.log(`📊 Room found: ${roomCode}, participants: ${room.participants.size}`);
      
      if (room.isGameStarted || room.isGameEnded) {
        console.log(`⚠️ Game already ${room.isGameStarted ? 'started' : 'ended'}`);
        socket.emit('error', { message: 'Игра уже началась или завершена' });
        return;
      }
      
      // Проверяем, что пользователь есть в комнате
      if (!room.participants.has(data.userId)) {
        console.log(`❌ User ${data.userId} not in room ${roomCode}`);
        socket.emit('error', { message: 'Пользователь не в комнате' });
        return;
      }

      // Обновляем статус готовности
      const participant = room.participants.get(data.userId);
      participant.isReady = !participant.isReady;
      
      // Подсчитываем количество готовых
      const readyCount = Array.from(room.participants.values())
        .filter(p => p.isReady).length;
      
      room.readyCount = readyCount;

      console.log(`📊 Ready count: ${readyCount}/${room.participants.size}`);

      // Отправляем обновление всем в комнате
      io.to(roomCode).emit('player-ready-update', {
        userId: data.userId,
        isReady: participant.isReady,
        readyCount: readyCount,
        totalParticipants: room.participants.size,
      });

      // Если все готовы и есть хотя бы 2 участника, запускаем обратный отсчет
      if (readyCount >= 1 && readyCount === room.participants.size) {
        console.log(`🎯 All ${readyCount} players ready, starting countdown!`);
        startCountdown(io, roomCode);
      } else {
        console.log(`⏳ Waiting for more players: ${readyCount}/${room.participants.size} ready`);
      }
    });

    // Запуск обратного отсчета
    const startCountdown = (io, roomCode) => {
      const room = rooms.get(roomCode);
      if (!room || room.isGameStarted || room.isGameEnded) {
        console.log(`⚠️ Cannot start countdown for room ${roomCode}: already started or ended`);
        return;
      }

      console.log(`⏱️ Starting countdown for room ${roomCode}`);
      
      let countdown = 5;
      
      // Отправляем начальное значение
      io.to(roomCode).emit('countdown', { seconds: countdown });

      const countdownInterval = setInterval(() => {
        countdown--;
        
        if (countdown > 0) {
          io.to(roomCode).emit('countdown', { seconds: countdown });
        } else {
          clearInterval(countdownInterval);
          // Запускаем игру
          startGame(io, roomCode);
        }
      }, 1000);
    };

    // Запуск игры
    const startGame = async (io, roomCode) => {
      const room = rooms.get(roomCode);
      if (!room) {
        console.log(`❌ Room ${roomCode} not found when starting game`);
        return;
      }

      console.log(`🚀 Starting game for room ${roomCode}`);
      
      room.isGameStarted = true;
      
      // Получаем вопросы для квиза
      try {
        const quiz = await Quiz.findById(room.quizId)
          .populate('questions');
        
        if (!quiz || quiz.questions.length === 0) {
          io.to(roomCode).emit('error', { 
            message: 'В квизе нет вопросов' 
          });
          return;
        }

        // Сохраняем вопросы в комнате
        room.questions = quiz.questions;
        room.currentQuestionIndex = -1;
        room.totalQuestions = quiz.questions.length;

        console.log(`📚 Loaded ${room.totalQuestions} questions for room ${roomCode}`);

        // Отправляем всем, что игра началась
        io.to(roomCode).emit('quiz-started');
        
        let timeLimit = Number(quiz.timeLimit) * 1000;
        // Запускаем первый вопрос через 2 секунды
        setTimeout(() => {
          nextQuestion(io, roomCode);
          room['questionDisplayInterval'] = setInterval(() => {
            nextQuestion(io, roomCode);
          }, timeLimit);
        }, 2000);

      } catch (error) {
        console.error('❌ Error starting game:', error);
        io.to(roomCode).emit('error', { 
          message: 'Ошибка при запуске игры' 
        });
      }
    };

    // Следующий вопрос
    const nextQuestion = (io, roomCode) => {
      const room = rooms.get(roomCode);
      if (!room || !room.isGameStarted || room.isGameEnded) return;

      room.currentQuestionIndex++;
      
      if (room.currentQuestionIndex >= room.questions.length) {
        // Квиз завершен
        console.log(`📝 All questions answered for room ${roomCode}`);
        endQuiz(io, roomCode);
        clearInterval(room['questionDisplayInterval']);
        return;
      }

      const question = room.questions[room.currentQuestionIndex];
      
      // Сбрасываем ответы участников
      room.participants.forEach((p) => {
        p.hasAnswered = false;
      });

      console.log(`📝 Sending question ${room.currentQuestionIndex + 1}/${room.questions.length} to room ${roomCode}`);

      // Отправляем вопрос всем
      io.to(roomCode).emit('question-display', {
        id: question._id,
        quizId: question.quizId,
        type: question.type,
        questionText: question.questionText,
        imageUrl: question.imageUrl,
        options: question.options,
        correctAnswer: question.correctAnswer,
        points: question.points,
        order: question.order,
        createdAt: question.createdAt,
        currentIndex: room.currentQuestionIndex + 1,
        totalQuestions: room.questions.length,
        startTime: Date.now(),
      });

      console.log(`📝 Question ${room.currentQuestionIndex + 1}/${room.questions.length} sent to ${roomCode}`);
    };

    // Завершение квиза
    const endQuiz = async (io, roomCode, quizId) => {
      const room = rooms.get(roomCode);
      if (!room || room.isGameEnded) return;

      console.log(`🏁 Quiz ended for room ${roomCode}, quizId: ${quizId}`);
      
      room.isGameStarted = false;
      room.isGameEnded = true;
      
      // Собираем результаты
      const results = Array.from(room.participants.values()).map(p => ({
        userId: p.userId,
        username: p.username,
        score: p.score || 0,
        answersCount: p.hasAnswered ? 1 : 0,
      }));

      // Сортируем по убыванию баллов
      results.sort((a, b) => b.score - a.score);

      console.log(`📊 Results for room ${roomCode}:`, results);

      // Сохраняем результаты в базу данных
      try {
        // Для каждого участника сохраняем результат
        for (const participant of room.participants.values()) {
          // Проверяем, есть ли уже результат
          const existingResult = await Result.findOne({
            quizId: room.quizId,
            userId: participant.userId,
          });

          if (!existingResult) {
            const result = new Result({
              quizId: room.quizId,
              userId: participant.userId,
              score: participant.score || 0,
              answers: [],
              timeTaken: 0,
            });
            await result.save();
            console.log(`✅ Result saved for ${participant.username}`);
          } else {
            // Обновляем существующий результат
            existingResult.score = participant.score || 0;
            await existingResult.save();
            console.log(`✅ Result updated for ${participant.username}`);
          }
        }

        // Обновляем статус квиза
        await Quiz.findByIdAndUpdate(room.quizId, { 
          status: 'completed',
          endTime: new Date(),
        });

        console.log('✅ Results saved to database');

      } catch (error) {
        console.error('❌ Error saving results:', error);
      }

      // Отправляем результаты всем в комнате
      io.to(roomCode).emit('quiz-ended', {
        results,
        totalQuestions: room.questions?.length || 0,
        quizId: quizId || room.quizId,
      });

      // НЕ УДАЛЯЕМ комнату сразу, чтобы дать время клиентам получить результаты
      // Удаляем через 30 секунд после завершения
      setTimeout(() => {
        if (rooms.has(roomCode)) {
          rooms.delete(roomCode);
          console.log(`🗑️ Room ${roomCode} cleaned up after 30 seconds`);
          logRoomsState();
        }
      }, 30000);
    };

    // Отправка результатов (для новых подключений после завершения)
    const sendQuizResults = (io, roomCode) => {
      const room = rooms.get(roomCode);
      if (!room || !room.isGameEnded) return;

      const results = Array.from(room.participants.values()).map(p => ({
        userId: p.userId,
        username: p.username,
        score: p.score || 0,
        answersCount: p.hasAnswered ? 1 : 0,
      }));

      results.sort((a, b) => b.score - a.score);

      io.to(roomCode).emit('quiz-ended', {
        results,
        totalQuestions: room.questions?.length || 0,
        quizId: room.quizId,
      });
    };

    // Обработка ответа
    socket.on('submit-answer', async (data) => {
      const { roomCode, questionId, selectedOption, answer } = data;
      
      console.log(`📝 Answer from ${username} for question ${questionId}`);
      console.log("answer: " + selectedOption);
      
      if (!rooms.has(roomCode)) {
        socket.emit('error', { message: 'Комната не найдена' });
        return;
      }

      const room = rooms.get(roomCode);
      
      if (!room.participants.has(userId)) {
        socket.emit('error', { message: 'Пользователь не в комнате' });
        return;
      }

      const participant = room.participants.get(userId);
      
      // Проверяем, не отвечал ли уже
      if (participant.hasAnswered) {
        socket.emit('error', { message: 'Вы уже ответили на этот вопрос' });
        return;
      }

      try {
        // Получаем вопрос из базы данных
        const question = await Question.findById(questionId);
        if (!question) {
          socket.emit('error', { message: 'Вопрос не найден' });
          return;
        }

        // Проверяем ответ
        let isCorrect = false;
        let userAnswer = answer || selectedOption;

        if (question.type === 'text') {
          isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        } else if (question.type === 'single_choice') {
          isCorrect = selectedOption === question.correctAnswer;
        } else if (question.type === 'multiple_choice') {
          console.log("checking multiple choice question");
          console.log("type of selected option: " + selectedOption.constructor.name);
          console.log(question.options.constructor.name);
          if (Array.isArray(selectedOption)){
            const answerText = JSON.stringify(selectedOption.sort());
            const optionsText = JSON.stringify(question.options.filter(opt => opt.isCorrect).map(opt => opt.text).sort());
            console.log(answerText, optionsText);
            isCorrect = answerText === optionsText;
          } else {
            isCorrect = false;
          }
        }

        const points = isCorrect ? question.points : 0;
        
        // Обновляем счет участника
        participant.score = (participant.score || 0) + points;
        participant.hasAnswered = true;

        console.log(`📊 ${username} answered: ${isCorrect ? '✅' : '❌'}, +${points} points, total: ${participant.score}`);

        // Отправляем результат пользователю
        socket.emit('answer-result', {
          isCorrect,
          points,
          correctAnswer: question.correctAnswer,
          totalScore: participant.score,
        });

        // Обновляем лидерборд для всех
        const leaderboard = Array.from(room.participants.values())
          .map(p => ({
            username: p.username,
            score: p.score || 0,
            userId: p.userId,
          }))
          .sort((a, b) => b.score - a.score);

        io.to(roomCode).emit('leaderboard-update', {
          leaderboard,
        });

      } catch (error) {
        console.error('❌ Error submitting answer:', error);
        socket.emit('error', { message: 'Ошибка при отправке ответа' });
      }
    });

    // Завершение вопроса (от организатора)
    socket.on('end-question', (data) => {
      const { roomCode } = data;
      
      console.log(`⏰ end-question from organizer ${userId} for room ${roomCode}`);
      
      if (!rooms.has(roomCode)) return;
      
      const room = rooms.get(roomCode);
      
      // Проверяем, что пользователь - организатор
      if (room.organizerId !== userId) {
        socket.emit('error', { message: 'Только организатор может завершить вопрос' });
        return;
      }

      if (room.isGameEnded) {
        socket.emit('error', { message: 'Квиз уже завершен' });
        return;
      }

      // Отправляем всем, что вопрос завершен
      io.to(roomCode).emit('question-ended');
      
      // Через 2 секунды переходим к следующему вопросу
      setTimeout(() => {
        nextQuestion(io, roomCode);
      }, 2000);
    });

    // Завершение квиза (от организатора)
    socket.on('end-quiz', async (data) => {
      const { roomCode, quizId } = data;
      console.log(`🏁 end-quiz event from organizer ${userId} for room ${roomCode}, quizId: ${quizId}`);
      
      if (!rooms.has(roomCode)) {
        socket.emit('error', { message: 'Комната не найдена' });
        return;
      }
      
      const room = rooms.get(roomCode);
      
      // Проверяем, что пользователь - организатор
      if (room.organizerId !== userId) {
        socket.emit('error', { message: 'Только организатор может завершить квиз' });
        return;
      }

      if (room.isGameEnded) {
        socket.emit('error', { message: 'Квиз уже завершен' });
        return;
      }

      // Используем переданный quizId или из комнаты
      const targetQuizId = quizId || room.quizId;
      
      // Завершаем квиз
      await endQuiz(io, roomCode, targetQuizId);
    });

    // Выход из комнаты
    socket.on('leave-room', (data) => {
      console.log(`👋 User ${data.userId} leaving room ${roomCode}`);
      
      if (rooms.has(roomCode)) {
        const room = rooms.get(roomCode);
        room.participants.delete(data.userId);
        room.totalParticipants--;
        
        if (room.participants.size === 0) {
          rooms.delete(roomCode);
          console.log(`🗑️ Room ${roomCode} deleted (no participants)`);
        } else {
          sendParticipantsUpdate(io, roomCode);
        }
      }

      socket.leave(roomCode);
    });

    // Отключение
    socket.on('disconnect', () => {
      console.log(`🔌 User ${username || 'unknown'} disconnected from ${roomCode}`);
      logRoomsState();
      
      // Проверяем, что комнаты существует и пользователь не организатор
      if (roomCode && rooms.has(roomCode)) {
        const room = rooms.get(roomCode);
        
        // Если пользователь - организатор и игра не завершена, не удаляем его
        if (room.organizerId === userId && !room.isGameEnded) {
          console.log(`👑 Organizer ${username} disconnected, but room ${roomCode} remains active`);
          return;
        }
        
        // Проверяем, есть ли пользователь в комнате
        if (room.participants.has(userId)) {
          room.participants.delete(userId);
          room.totalParticipants--;
          
          if (room.participants.size === 0) {
            rooms.delete(roomCode);
            console.log(`🗑️ Room ${roomCode} deleted (no participants)`);
          } else {
            sendParticipantsUpdate(io, roomCode);
          }
        }
      }
    });
  });
};

// Вспомогательная функция для отправки обновления участников
function sendParticipantsUpdate(io, roomCode) {
  if (!rooms.has(roomCode)) return;
  
  const room = rooms.get(roomCode);
  const participantList = Array.from(room.participants.values()).map(p => ({
    userId: p.userId,
    username: p.username,
    isReady: p.isReady || false,
  }));
  
  console.log(`📤 Sending participants update for room ${roomCode}:`, participantList);
  
  io.to(roomCode).emit('participants-update', { 
    participants: participantList 
  });
}