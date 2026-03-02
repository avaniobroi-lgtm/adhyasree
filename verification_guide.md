# FocusFun Project Verification Guide

This guide explains how to verify all the current functionalities of the FocusFun project.

## 1. Backend Server Check

Verify the server is up and running.
- **Endpoint**: `GET http://localhost:5000/api/status`
- **Expected Result**: 
  ```json
  { "status": "FocusFun API is active and VERIFIED! 🔥" }
  ```

## 2. Authentication (Firebase)

Authentication is handled via Firebase on the client side. The backend verifies the ID token.
- **How to test**: 
  1. Open the app in your browser (`http://localhost:5000/auth`).
  2. Sign in or Sign up.
  3. Check the browser console to ensure the Firebase token is being sent in the `Authorization` header (`Bearer <token>`).

## 3. Study Sessions

- **Save Session**: `POST /api/study/`
  - Payload: `{ "topic": "Math", "duration": 30, "completed": true }`
  - Requires: Auth Token.
- **Get Sessions**: `GET /api/study/`
  - Returns a list of the last 10 sessions for the authenticated user.

## 4. Quizzes & Leaderboard

- **Save Quiz Result**: `POST /api/quiz/result`
  - Payload: `{ "score": 8, "totalQuestions": 10 }`
  - Requires: Auth Token.
  - *Effect*: Updates user's high score and streak if requirements are met.
- **Leaderboard**: `GET /api/quiz/leaderboard`
  - Returns the top 10 users ranked by total study time.

## 5. Trial Quiz (New Feature)

- **Standalone Quiz**: `POST /api/quiz/trial`
  - Payload: `{ "score": 5, "totalQuestions": 5, "streakOption": true }`
  - Requires: Auth Token.
  - *Effect*: If `streakOption` is true and the user passes (score > 0), it updates/maintains the streak even without a study session.

## 6. Social & Friends

- **Add Friend**: `POST /api/friends/add`
  - Payload: `{ "friendEmail": "friend@example.com" }`
- **List Friends**: `GET /api/friends/`
  - Displays friends and their current study streaks.

## 7. Challenges

- **Send Challenge**: `POST /api/friends/challenge`
  - Payload: `{ "toUid": "TARGET_UID", "duration": 45, "topic": "Science" }`
- **Respond to Challenge**: `POST /api/friends/challenges/:id/respond`
  - Payload: `{ "action": "accepted" }` (or "declined")

## Troubleshooting

- **Firebase Error**: If you see "Firebase Admin initialization error", ensure your `serviceAccountKey.json` is present in the `server` directory and the path is set in `.env`.
- **Unauthorized**: Ensure you are logged in and the `Authorization` header is correct.
