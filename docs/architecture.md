# Project Architecture

## Overview
FocusFun follows a classic Client-Server architecture with a cloud-based backend-as-a-service (Firebase).

## System Components

### 1. Client Layer (public/)
- **HTML/CSS**: Responsive UI built with modern CSS and semantic HTML.
- **JavaScript**: Client-side logic for the timer, local state management, and API communication.

### 2. Server Layer (app/)
- **Express.js**: Handles routing and provides a RESTful API for the frontend.
- **Controllers**: Encapsulate business logic for study sessions, quizzes, and social features.
- **Routes**: Define the API endpoints and map them to controllers.

### 3. Data & Auth Layer (Firebase)
- **Firebase Authentication**: Manages user sign-up and login securely.
- **Firebase Realtime Database**: Stores user progress, streaks, and quiz scores.

## Data Flow
1. User interacts with the UI.
2. Client-side JS makes an AJAX request to the server.
3. Server validates the request (middleware).
4. Server interacts with Firebase to fetch or update data.
5. Server sends a JSON response back to the client.
6. UI updates dynamically based on the response.
