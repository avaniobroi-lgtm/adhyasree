const { db } = require('../firebaseAdmin');

/* ─── Add Friend ────────────────────────────────── */
exports.addFriend = async (req, res) => {
    try {
        const { friendEmail } = req.body;
        const uid = req.user.uid;

        const friendSnapshot = await db.collection('users')
            .where('email', '==', friendEmail).limit(1).get();

        if (friendSnapshot.empty)
            return res.status(404).send({ error: 'User not found' });

        const friendDoc = friendSnapshot.docs[0];
        const friendId = friendDoc.id;

        if (friendId === uid)
            return res.status(400).send({ error: 'You cannot add yourself' });

        const friendshipId = uid < friendId ? `${uid}_${friendId}` : `${friendId}_${uid}`;
        const friendshipRef = db.collection('friendships').doc(friendshipId);

        if ((await friendshipRef.get()).exists)
            return res.status(400).send({ error: 'Already friends or request pending' });

        await friendshipRef.set({
            users: [uid, friendId],
            status: 'accepted',
            createdAt: new Date().toISOString()
        });

        res.status(201).send({ message: 'Friend added successfully' });
    } catch (error) {
        console.error('Error adding friend:', error);
        res.status(500).send({ error: 'Failed to add friend' });
    }
};

/* ─── Get Friends (with streak data) ────────────── */
exports.getFriends = async (req, res) => {
    try {
        const uid = req.user.uid;
        const snapshot = await db.collection('friendships')
            .where('users', 'array-contains', uid).get();

        const friendsData = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const friendId = data.users.find(id => id !== uid);
            const friendDoc = await db.collection('users').doc(friendId).get();
            if (friendDoc.exists) {
                const fData = friendDoc.data();
                friendsData.push({
                    id: friendId,
                    friendshipDocId: doc.id,
                    username: fData.username || fData.email,
                    streak: fData.streak || 0,
                    totalStudyTime: fData.totalStudyTime || 0,
                    lastStudyDate: fData.lastStudyDate || null
                });
            }
        }

        res.status(200).send(friendsData);
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).send({ error: 'Failed to fetch friends' });
    }
};

/* ─── Remove Friend ─────────────────────────────── */
exports.removeFriend = async (req, res) => {
    try {
        const uid = req.user.uid;
        const friendId = req.params.friendId;

        const friendshipId = uid < friendId ? `${uid}_${friendId}` : `${friendId}_${uid}`;
        const friendshipRef = db.collection('friendships').doc(friendshipId);

        if (!(await friendshipRef.get()).exists)
            return res.status(404).send({ error: 'Friendship not found' });

        await friendshipRef.delete();
        res.status(200).send({ message: 'Friend removed' });
    } catch (error) {
        console.error('Error removing friend:', error);
        res.status(500).send({ error: 'Failed to remove friend' });
    }
};

/* ─── Send Challenge ────────────────────────────── */
exports.sendChallenge = async (req, res) => {
    try {
        const { toUid, duration, topic } = req.body;
        const fromUid = req.user.uid;

        if (!toUid || !duration)
            return res.status(400).send({ error: 'toUid and duration are required' });

        // Get sender username
        const senderDoc = await db.collection('users').doc(fromUid).get();
        const senderName = senderDoc.exists
            ? (senderDoc.data().username || senderDoc.data().email)
            : 'A friend';

        const challenge = {
            fromUid,
            toUid,
            fromName: senderName,
            duration: parseInt(duration),
            topic: topic || 'General Study',
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('challenges').add(challenge);
        res.status(201).send({ id: docRef.id, message: 'Challenge sent!' });
    } catch (error) {
        console.error('Error sending challenge:', error);
        res.status(500).send({ error: 'Failed to send challenge' });
    }
};

/* ─── Get My Incoming Challenges ────────────────── */
exports.getChallenges = async (req, res) => {
    try {
        const uid = req.user.uid;
        const snapshot = await db.collection('challenges')
            .where('toUid', '==', uid)
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();

        const challenges = [];
        snapshot.forEach(doc => challenges.push({ id: doc.id, ...doc.data() }));
        res.status(200).send(challenges);
    } catch (error) {
        console.error('Error fetching challenges:', error);
        res.status(500).send({ error: 'Failed to fetch challenges' });
    }
};

/* ─── Respond to Challenge ──────────────────────── */
exports.respondChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body;  // 'accepted' | 'declined'
        const uid = req.user.uid;

        if (!['accepted', 'declined'].includes(action))
            return res.status(400).send({ error: 'action must be accepted or declined' });

        const challengeRef = db.collection('challenges').doc(id);
        const challengeDoc = await challengeRef.get();

        if (!challengeDoc.exists)
            return res.status(404).send({ error: 'Challenge not found' });

        if (challengeDoc.data().toUid !== uid)
            return res.status(403).send({ error: 'Not your challenge' });

        await challengeRef.update({ status: action, respondedAt: new Date().toISOString() });
        res.status(200).send({ message: `Challenge ${action}` });
    } catch (error) {
        console.error('Error responding to challenge:', error);
        res.status(500).send({ error: 'Failed to respond' });
    }
};
