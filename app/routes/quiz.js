const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const verifyToken = require('../middleware/auth');

router.post('/result', verifyToken, quizController.saveQuizResult);
router.post('/trial', verifyToken, quizController.saveTrialQuizResult);
router.get('/leaderboard', quizController.getLeaderboard);

module.exports = router;
