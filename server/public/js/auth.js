// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAwyDkM35LGoLwqXmxHUlv3gaNcd8f4riw",
    authDomain: "focus-fun-b4047.firebaseapp.com",
    projectId: "focus-fun-b4047",
    storageBucket: "focus-fun-b4047.firebasestorage.app",
    messagingSenderId: "179204372294",
    appId: "1:179204372294:web:d6e9f9945a4432c4805747",
    measurementId: "G-SK79ET5KW7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const submitBtn = document.getElementById('submit-btn');
const toggleBtn = document.getElementById('toggle-btn');
const usernameGroup = document.getElementById('username-group');
const errorDisplay = document.getElementById('error-display');

let isLogin = true;

toggleBtn.addEventListener('click', () => {
    isLogin = !isLogin;
    authTitle.textContent = isLogin ? 'Welcome Back' : 'Create Account';
    authSubtitle.textContent = isLogin ? 'Log in to continue your focus journey' : 'Join thousands of students leveling up';
    submitBtn.textContent = isLogin ? 'Login' : 'Register';
    toggleBtn.textContent = isLogin ? 'Register' : 'Login';
    document.getElementById('toggle-text').childNodes[0].textContent = isLogin ? "Don't have an account? " : "Already have an account? ";
    usernameGroup.style.display = isLogin ? 'none' : 'flex';
    errorDisplay.style.display = 'none';
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;

    errorDisplay.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = isLogin ? 'Logging in...' : 'Creating account...';

    try {
        if (isLogin) {
            await auth.signInWithEmailAndPassword(email, password);
        } else {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Create user profile in Firestore
            await db.collection('users').doc(user.uid).set({
                username: username,
                email: email,
                streak: 0,
                totalStudyTime: 0,
                lastStudyDate: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        // Redirect to dashboard on success
        window.location.href = '/';
    } catch (error) {
        errorDisplay.textContent = error.message;
        errorDisplay.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = isLogin ? 'Login' : 'Register';
    }
});

// Check if user is already logged in
auth.onAuthStateChanged(user => {
    if (user && window.location.pathname.includes('/auth')) {
        window.location.href = '/';
    }
});
