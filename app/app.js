const express = require('express');
const cors = require('cors');
require('dotenv').config();

const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/', (req, res) => {
    console.log('Root hit - rendering index.ejs');
    res.render('index');
});

app.get('/auth', (req, res) => {
    console.log('Auth hit - rendering auth.ejs');
    res.render('auth');
});

app.get('/api/status', (req, res) => {
    res.send({ status: 'FocusFun API is active and VERIFIED! 🔥' });
});

// Import Routes
const studyRoutes = require('./routes/study');
const quizRoutes = require('./routes/quiz');
const friendRoutes = require('./routes/friends');

app.use('/api/study', studyRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/friends', friendRoutes);

// Fallback to home for any other unhandled routes
app.use((req, res) => {
    console.log('Fallback hit - redirecting to /');
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
