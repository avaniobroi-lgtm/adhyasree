const { db } = require('../firebaseAdmin');

exports.saveQuizResult = async (req, res) => {
    try {
        const { score, totalQuestions } = req.body;
        const uid = req.user.uid;

        const resultData = {
            uid,
            score: parseInt(score),
            totalQuestions: parseInt(totalQuestions),
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('quizResults').add(resultData);

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            const today = new Date().toISOString().split('T')[0];
            const lastStudyDate = userData.lastStudyDate ? userData.lastStudyDate.split('T')[0] : null;

            let newStreak = userData.streak || 0;
            // Only increment streak if the user studied today and hasn't already gotten a streak for today
            if (lastStudyDate === today) {
                if (userData.lastStreakUpdate !== today) {
                    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                    if (userData.lastStreakUpdate === yesterday) {
                        newStreak++;
                    } else {
                        newStreak = 1;
                    }
                }
            }

            await userRef.update({
                totalQuizzes: (userData.totalQuizzes || 0) + 1,
                highScore: Math.max(userData.highScore || 0, resultData.score),
                streak: newStreak,
                lastStreakUpdate: today
            });
        }

        res.status(201).send({ id: docRef.id, message: 'Quiz result saved' });
    } catch (error) {
        console.error('Error saving quiz result:', error);
        res.status(500).send({ error: 'Failed to save quiz result' });
    }
};

exports.saveTrialQuizResult = async (req, res) => {
    try {
        const { score, totalQuestions, streakOption } = req.body;
        const uid = req.user.uid;

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        const today = new Date().toISOString().split('T')[0];

        if (userDoc.exists && streakOption && score > 0) {
            const userData = userDoc.data();
            let newStreak = userData.streak || 0;

            if (userData.lastStreakUpdate !== today) {
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                if (userData.lastStreakUpdate === yesterday) {
                    newStreak++;
                } else {
                    newStreak = 1;
                }

                await userRef.update({
                    streak: newStreak,
                    lastStreakUpdate: today
                });
            }
        }

        res.status(201).send({ message: 'Trial quiz completed', streakUpdated: streakOption && score > 0 });
    } catch (error) {
        console.error('Error saving trial quiz:', error);
        res.status(500).send({ error: 'Failed to save trial quiz' });
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const snapshot = await db.collection('users')
            .orderBy('totalStudyTime', 'desc')
            .limit(10)
            .get();

        const leaderboard = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            leaderboard.push({
                username: data.username || data.email,
                totalStudyTime: data.totalStudyTime || 0,
                streak: data.streak || 0
            });
        });

        res.status(200).send(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).send({ error: 'Failed to fetch leaderboard' });
    }
};
