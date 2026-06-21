# Eco-Insight: Carbon Footprint Assistant 🌱

This project was built for **Challenge 3**, aiming to help individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.

## Chosen Vertical: Personal Sustainability Assistant
The solution acts as an intelligent, conversational web dashboard where users log their daily activities. The assistant dynamically calculates the carbon footprint of those activities and provides actionable, personalized tips to reduce their impact.

## How It Works
1. **Interactive Tracking:** Users log activities either by clicking "Quick Actions" or by typing natural language into the assistant chat (e.g., "I drove 15 miles").
2. **Dynamic Dashboard:** The UI updates in real-time, displaying a cumulative carbon footprint score categorized into Transport, Food, and Energy.
3. **Smart Insights:** Based on the user's input, the assistant calculates the CO₂ impact and returns context-aware tips (e.g., if a user logs a meat-based meal, the assistant suggests swapping to a plant-based meal to save ~2.6 kg of CO₂).

## Architecture & Approach
This project is built using **Pure Vanilla HTML, CSS, and JavaScript**. 
This approach was chosen intentionally to:
- Ensure the repository remains **extremely lightweight** (well under the 10MB limit).
- Guarantee zero build-step complexity.
- Maximize performance and load speed (Efficiency).

## Addressing Evaluation Focus Areas
- **Code Quality:** Modular, heavily commented ES6 JavaScript. Semantic HTML structure.
- **Security:** Zero backend server. All user data is processed locally and saved securely in the browser's `localStorage`. Input sanitization prevents Cross-Site Scripting (XSS).
- **Efficiency:** No heavy frameworks (like React/Next.js) or bloated libraries. Instant rendering.
- **Testing:** Includes a custom test suite (`tests.js`) that automatically validates the carbon calculation engine's math.
- **Accessibility:** Uses semantic tags (`<main>`, `<aside>`), ARIA labels, keyboard navigability, and a high-contrast dark mode theme optimized for readability.

## Assumptions Made
- Default baseline calculations are based on US averages (e.g., 0.404 kg CO₂ per mile driven by an average gas car).
- Users have modern browsers supporting CSS variables and standard ES6 JS features.

## How to Run Locally
1. Clone the repository.
2. Open `index.html` directly in any web browser. No server required!
3. To run tests: `node tests.js`
