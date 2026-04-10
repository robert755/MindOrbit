# MindOrbit

MindOrbit is a calm space for daily reflection.  
You log how your day felt, track your energy and mood, and at the end of the week you get an AI-powered ritual: a short summary of patterns, suggestions, and gentle next steps.

The goal is simple: help you notice your emotional rhythm before burnout notices it for you.

## What You Can Do

- **Daily check-ins (CRUD):** create, edit, delete, and review entries.
- **Voice check-in:** record your voice and let AI analyze both what you said and how it sounded.
- **Mood + energy tracking:** keep a consistent emotional history.
- **Weekly journal view:** navigate by week and revisit patterns.
- **AI weekly ritual:** generated summary, emotional trends, practical suggestions, and music recommendations.

### Voice Check-In (How It Works)

From the Daily Check-In screen, you can record audio and send it to the backend:

- Endpoint: `POST /checkins/user/{userId}/voice`
- Request type: `multipart/form-data`
- Fields: `audio` (required), `date` (optional), `activity` (optional)

The backend uses Gemini to process audio + text and maps the detected mood to your backend `Mood` enum:
`Happy`, `Stressed`, `Neutral`, `Sad`, `Anxious`, `Calm`, `Excited`, `Tired`, `Grateful`, `Overwhelmed`.

Each voice entry can store:
- transcription
- voice-tone explanation
- confidence score
- `moodSource: VOICE` (manual entries use `MANUAL`)

## Tech Stack

- **Web Frontend:** React, Tailwind CSS, Axios
- **Mobile:** React Native (Expo), Expo Router, NativeWind
- **Backend:** Java Spring Boot, Spring Data JPA, Hibernate
- **Database:** MySQL
- **AI:** Google Gemini API (weekly reports + voice analysis)

## Setup

### 1) Backend

- Configure `mindorbit/src/main/resources/application.properties`:
  - MySQL credentials
  - Gemini API key (`gemini.api.key` or env variable)
- Run Spring Boot on port `8081`.

Recommended for mobile testing on the same network:

```properties
server.port=8081
server.address=0.0.0.0
```

### 2) Web App

```bash
cd frontend
npm install
npm run dev
```

### 3) Mobile App (Expo)

```bash
cd mindorbit-mobile
npm install
```

Create `mindorbit-mobile/.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LAPTOP_IP>:8081
```

Example:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.100:8081
```

Start Expo:

```bash
npx expo start --clear
```

## Mobile Networking Notes (Important)

- `localhost` works on your laptop, but **not** on a physical phone.
- Use your laptop's local IP in `.env`.
- Phone and laptop must be on the same Wi-Fi.
- Allow inbound port `8081` in Windows Firewall.
- Ensure backend CORS is configured for your dev origins.

## Development Notes

This project used LLM assistance for:
- boilerplate acceleration
- prompt tuning for structured AI output
- debugging tricky edge cases (especially date boundaries)

One important issue solved was week-range filtering with `LocalDateTime`:  
the end date at `00:00:00` excluded entries later in the same day.  
The fix was to use an inclusive end-of-day strategy so weekly reflection data is complete.
