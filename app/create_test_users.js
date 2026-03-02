const { auth, db } = require('./firebaseAdmin');

async function createTestUser(email, password, username, studyTime, streak) {
    try {
        let user;
        try {
            user = await auth.getUserByEmail(email);
            console.log(`User ${email} already exists.`);
        } catch (e) {
            user = await auth.createUser({
                email,
                password,
                displayName: username
            });
            console.log(`User ${email} created.`);
        }

        await db.collection('users').doc(user.uid).set({
            email,
            username,
            totalStudyTime: studyTime || 0,
            streak: streak || 0,
            lastStudyDate: new Date().toISOString(),
            createdAt: new Date().toISOString()
        }, { merge: true });

        console.log(`Data for ${username} updated in Firestore.`);
    } catch (error) {
        console.error(`Error for ${email}:`, error);
    }
}

async function run() {
    await createTestUser('user1@focusfun.com', 'password123', 'AlphaFlapper', 120, 5);
    await createTestUser('user2@focusfun.com', 'password123', 'BetaFocuser', 85, 3);
}

run().then(() => process.exit());
