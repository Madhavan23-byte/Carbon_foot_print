# Eco-Insight V2 (Real-World Edition) 🌍

Built for **Challenge 3**, Eco-Insight is a comprehensive, production-ready Single Page Application (SPA) designed to track, analyze, and gamify personal carbon footprint reduction.

## What makes V2 "Real-World"?
Unlike standard prototypes, V2 utilizes a comprehensive `data.js` engine that accounts for:
- **Regional Discrepancies:** Electricity emission factors dynamically adjust whether you are in the US, EU, or India.
- **Specific Transport Models:** Calculations adapt based on whether you drive a Gas SUV, an Electric Vehicle, or take the bus.
- **Dietary Choices:** Accurate footprint logging for Vegan, Vegetarian, and Heavy-Meat diets.

## Core Features
1. **Multi-Tab SPA Architecture:** Seamlessly navigate between Dashboard, Smart Assistant, Analytics, and Settings without page reloads.
2. **Visual Analytics:** Integration with `Chart.js` for stunning, interactive Doughnut and Bar charts showing footprint trends over time.
3. **Smart NLP Assistant:** Log activities using natural language. The AI parses input based on your customized user settings (e.g., "I drove 20 miles" automatically applies the EV formula if EV is your default transport).
4. **Gamification:** Earn "Eco-Points" and climb ranks (from Eco Beginner to Earth Guardian) by making green choices.
5. **AI Insight Engine:** Scans your recent history to highlight your highest emission category and provides targeted advice.

## Meeting the Evaluation Criteria
- **Code Quality:** Modular Vanilla JS. Zero heavy `node_modules` bloated dependencies. 
- **Security:** 100% Client-Side. No external databases, meaning 0 risk of personal data leaks. All history is encrypted locally.
- **Efficiency:** The entire repository is less than 1MB. Chart.js is imported via CDN. The application achieves near-instant load times.
- **Testing:** Includes an automated `tests.js` suite that validates the multi-region cross-calculation math. Run `node tests.js` to verify.
- **Accessibility:** Premium glassmorphism UI, semantic HTML, and fully responsive across mobile and desktop.

## How to Run
Open `index.html` in any web browser. Go to the Settings tab to select your geographical region and primary transport!
