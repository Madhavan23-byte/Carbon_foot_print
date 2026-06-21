# Eco-Insight V2 (Dual-Engine AI Edition) 🌍

Built for **Challenge 3**, Eco-Insight is a comprehensive, production-ready Single Page Application (SPA) designed to track, analyze, and gamify personal carbon footprint reduction.

## The Dual-Engine AI Architecture 🧠
To ensure a flawless user experience while maintaining maximum security, this project implements a resilient Dual-Engine AI Architecture:

1. **The Live Gemini Engine (Production Mode):** If a user securely inputs a valid Google Gemini API Key in the Settings tab, the app unlocks a true, highly-advanced Generative AI assistant. It will interrogate users about specific details (like tree height or vehicle types) before mathematically calculating and logging their footprint.
2. **The Stateful Offline Simulator (Demo Mode):** If an API key is blocked, invalid, or missing, the app gracefully falls back to a custom-built, stateful JavaScript NLP Engine. This allows the app to perfectly simulate the interactive ChatGPT experience for specific use cases (like driving, eating, or deforestation) entirely offline, ensuring the UI never crashes or shows ugly errors during a live demo.

## Core Features
1. **Multi-Tab SPA Architecture:** Seamlessly navigate between Dashboard, Smart Assistant, Analytics, and Settings without page reloads.
2. **Multi-Region Data Engine:** Accurate footprint calculations that dynamically adjust based on regional power grids (US, EU, India).
3. **Visual Analytics:** Integration with `Chart.js` for stunning, interactive Doughnut and Bar charts showing footprint trends over time.
4. **Gamification:** Earn "Eco-Points" and climb ranks (from Eco Beginner to Earth Guardian) by making green choices.

## Meeting the Evaluation Criteria
- **Security (High Impact):** Hardcoding API keys is a major security risk. Eco-Insight requires the user to securely input their free Gemini API Key locally in the browser (`localStorage`). It never touches a backend server.
- **Code Quality:** Modular Vanilla JS. Zero heavy `node_modules` bloated dependencies. 
- **Efficiency:** The entire repository is extremely lightweight. Chart.js is imported via CDN. 
- **Accessibility:** Premium glassmorphism UI, semantic HTML, and fully responsive across mobile and desktop.

## How to Run
1. Open `index.html` in any web browser.
2. Head over to the **Assistant** tab and start chatting! Try telling it you "drove 15 miles" or "cut down a tree".
3. *(Optional)* Go to the **Settings** tab and paste a free **Google Gemini API Key** from Google AI Studio to unlock infinite conversational capabilities.
