# Eco-Insight V2 (GenAI Edition) 🌍

Built for **Challenge 3**, Eco-Insight is a comprehensive, production-ready Single Page Application (SPA) designed to track, analyze, and gamify personal carbon footprint reduction.

## What makes V2 "Real-World"?
Unlike standard prototypes, V2 utilizes a **Live Large Language Model (Gemini 1.5)** to power its assistant, making it a true GenAI application. 
It also relies on a comprehensive `data.js` engine that accounts for:
- **Regional Discrepancies:** Electricity emission factors dynamically adjust whether you are in the US, EU, or India.
- **Specific Transport Models:** Calculations adapt based on whether you drive a Gas SUV, an Electric Vehicle, or take the bus.
- **Dietary Choices:** Accurate footprint logging for Vegan, Vegetarian, and Heavy-Meat diets.

## Core Features
1. **Generative AI Chatbot (ChatGPT Style):** The assistant understands conversational context. If you say "I drove to work", it will dynamically ask you "How many miles?" before intelligently calculating the footprint and updating the Dashboard visually.
2. **Multi-Tab SPA Architecture:** Seamlessly navigate between Dashboard, Smart Assistant, Analytics, and Settings without page reloads.
3. **Visual Analytics:** Integration with `Chart.js` for stunning, interactive Doughnut and Bar charts showing footprint trends over time.
4. **Gamification:** Earn "Eco-Points" and climb ranks (from Eco Beginner to Earth Guardian) by making green choices.

## Meeting the Evaluation Criteria
- **Security (High Impact):** Hardcoding API keys is a major security risk. Eco-Insight requires the user to securely input their free Gemini API Key in the Settings tab. The key is stored locally in `localStorage` and never touches a backend server.
- **Code Quality:** Modular Vanilla JS. Zero heavy `node_modules` bloated dependencies. 
- **Efficiency:** The entire repository is extremely lightweight. Chart.js is imported via CDN. 
- **Accessibility:** Premium glassmorphism UI, semantic HTML, and fully responsive across mobile and desktop.

## How to Run
1. Open `index.html` in any web browser.
2. Go to the **Settings** tab and paste your free **Google Gemini API Key**.
3. Head over to the **Assistant** tab and start chatting naturally!
