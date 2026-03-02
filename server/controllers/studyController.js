const { db } = require('../firebaseAdmin');

exports.createSession = async (req, res) => {
    try {
        const { topic, duration, completed } = req.body;
        const uid = req.user.uid;

        const sessionData = {
            uid,
            topic: topic || 'General Study',
            duration: parseInt(duration),
            completed: !!completed,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('studySessions').add(sessionData);

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            await userRef.update({
                totalStudyTime: (userData.totalStudyTime || 0) + sessionData.duration,
                lastStudyDate: sessionData.createdAt
            });
        }

        res.status(201).send({ id: docRef.id, message: 'Focus session recorded' });
    } catch (error) {
        console.error('Error creating study session:', error);
        res.status(500).send({ error: 'Failed to save session' });
    }
};

exports.getUserSessions = async (req, res) => {
    try {
        const uid = req.user.uid;
        const snapshot = await db.collection('studySessions')
            .where('uid', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();

        const sessions = [];
        snapshot.forEach(doc => {
            sessions.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).send(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).send({ error: 'Failed to fetch sessions' });
    }
};
