# MindOrbit
MindOrbit is a reflective journaling application designed to help users track their wellbeing, identify emotional patterns, and receive personalized insights through artificial intelligence.
The application allows users to record their daily activities, energy levels, and moods. At the end of the week, it offers an AI-generated "Ritual"—a summary that analyzes the user's progress and provides actionable advice.

# Key Features
Full Journaling (CRUD): Users can create, view, edit, and delete daily check-ins.
Weekly Filtering: Intuitive navigation between weeks to revisit history.
AI Insights (Gemini API): Processes weekly data to generate:
* A concise Week Summary.
* Identification of Emotional Patterns.
* Practical Suggestions for wellbeing improvement.
* Music Recommendations based on the week's vibe.
Polished UI/UX: A clean, modern interface built with React, focusing on a calm user experience using glassmorphism and a soft color palette.

# Tech Stack
Frontend: React.js, Tailwind CSS, Axios.

Backend: Java Spring Boot, Spring Data JPA, Hibernate.

Database: MySQL.

AI Integration: Google Gemini API (via GeminiService).

LLMs & Tools: 
* Gemini 3 Flash: Powering the weekly analysis and sentiment processing.
* ChatGPT / Claude: Used to accelerate boilerplate code generation and assist in debugging complex date-range logic.

# LLM-Assisted Development & Technical Hurdles
This project leveraged AI to accelerate the build process, specifically in scaffolding the Spring Boot architecture and refining the AI prompts for structured JSON output.

Technical Hurdle: The "Date Boundary" Logic
A specific challenge occurred when querying check-ins for the current week (e.g., March 2nd to March 8th). Even though a record existed for March 8th, the SQL BETWEEN query returned an empty list, triggering a 500 error.
The Cause: The MySQL LocalDateTime column treated the end date (March 8) as 00:00:00. Any entry created later in the day (e.g., 10:30 AM) was outside the upper boundary.

Prompting Strategy: I prompted the LLM to explain why specific dates were being skipped despite existing in the DB. The AI initially suggested a basic "inclusive" check, but through iterative prompting ("Explain how to handle inclusive date boundaries in JPA when the DB has time components"), we arrived at the solution: extending the endDate by one day or setting it to 23:59:59 to ensure no reflections were lost.

# Installation & Setup
Backend: * Configure src/main/resources/application.properties with your MySQL credentials and Gemini API Key.

Run the Spring Boot application.

Frontend:

Navigate to the client folder.

Run npm install and npm run dev.

