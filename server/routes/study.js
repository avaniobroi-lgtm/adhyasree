const express = require('express');
const router = express.Router();
const studyController = require('../controllers/studyController');
const verifyToken = require('../middleware/auth');

router.post('/', verifyToken, studyController.createSession);
router.get('/', verifyToken, studyController.getUserSessions);

module.exports = router;
