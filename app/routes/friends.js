const express = require('express');
const router = express.Router();
const fc = require('../controllers/friendController');
const verifyToken = require('../middleware/auth');

router.post('/add', verifyToken, fc.addFriend);
router.get('/', verifyToken, fc.getFriends);
router.delete('/:friendId', verifyToken, fc.removeFriend);
router.post('/challenge', verifyToken, fc.sendChallenge);
router.get('/challenges', verifyToken, fc.getChallenges);
router.post('/challenges/:id/respond', verifyToken, fc.respondChallenge);

module.exports = router;
