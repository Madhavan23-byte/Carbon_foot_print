/**
 * Eco-Insight Smart Assistant Engine
 * Focus: Efficiency, Security (Local Storage Only), and Code Quality
 */

// 1. DATA & STATE MANAGEMENT
const STATE_KEY = 'eco_insight_data';

// Load state from localStorage or initialize defaults
let state = JSON.parse(localStorage.getItem(STATE_KEY)) || {
    totalCO2: 0,
    categories: {
        transport: 0,
        food: 0,
        energy: 0
    }
};

// Emission Factors (kg CO2 per unit) - Base rules for the calculation engine
const EMISSION_FACTORS = {
    car_mile: 0.404,    // Average gas car per mile
    bus_mile: 0.089,    // Average bus per mile
    meal_meat: 3.3,     // Average high-meat meal
    meal_vegan: 0.7,    // Average vegan meal
    electricity_kwh: 0.385 // Average US grid per kWh
};

// 2. DOM ELEMENTS
const totalCo2El = document.getElementById('total-co2');
const statTransport = document.getElementById('stat-transport');
const statFood = document.getElementById('stat-food');
const statEnergy = document.getElementById('stat-energy');
const chatHistory = document.getElementById('chat-history');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const resetBtn = document.getElementById('reset-btn');
const actionBtns = document.querySelectorAll('.action-btn');
const circleIndicator = document.querySelector('.circle');

// 3. CORE FUNCTIONS

/**
 * Updates the dashboard UI with current state and color-codes the footprint severity
 */
function updateDashboard() {
    // Update numerical values
    totalCo2El.innerText = state.totalCO2.toFixed(1);
    statTransport.innerText = state.categories.transport.toFixed(1) + ' kg';
    statFood.innerText = state.categories.food.toFixed(1) + ' kg';
    statEnergy.innerText = state.categories.energy.toFixed(1) + ' kg';
    
    // Save to local storage (Security & Efficiency: No backend needed)
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    
    // Dynamic color coding logic
    if (state.totalCO2 > 20) {
        circleIndicator.style.borderColor = '#ef4444'; // Red (High impact)
        circleIndicator.style.boxShadow = '0 0 30px rgba(239, 68, 68, 0.3)';
    } else if (state.totalCO2 > 10) {
        circleIndicator.style.borderColor = '#eab308'; // Yellow (Medium impact)
        circleIndicator.style.boxShadow = '0 0 30px rgba(234, 179, 8, 0.3)';
    } else {
        circleIndicator.style.borderColor = 'var(--primary)'; // Green (Low impact)
        circleIndicator.style.boxShadow = '0 0 30px rgba(34, 197, 94, 0.3)';
    }
}

/**
 * Appends a new message to the chat UI securely
 */
function addMessage(text, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(isUser ? 'user-msg' : 'bot-msg');
    
    // Simple sanitization to prevent XSS (Security feature)
    const sanitizedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    // Allow bold tags for emphasis we add internally
    msgDiv.innerHTML = isUser ? sanitizedText : text; 
    
    chatHistory.appendChild(msgDiv);
    
    // Auto-scroll to bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

/**
 * Logic engine to process specific actions, calculate emissions, and return tips
 */
function processAction(actionId, customAmount = null) {
    let addedCO2 = 0;
    let category = '';
    let responseText = '';

    // Smart decision tree
    switch(actionId) {
        case 'commute_car':
            const milesCar = customAmount || 10;
            addedCO2 = milesCar * EMISSION_FACTORS.car_mile;
            category = 'transport';
            responseText = `Logged ${milesCar} miles of driving. That adds roughly <strong>${addedCO2.toFixed(1)} kg CO₂</strong>. <br><small style="color:var(--primary); margin-top:5px; display:block;">💡 Tip: Taking public transit instead could reduce this by up to 75%.</small>`;
            break;
        case 'commute_bus':
            const milesBus = customAmount || 10;
            addedCO2 = milesBus * EMISSION_FACTORS.bus_mile;
            category = 'transport';
            responseText = `Logged ${milesBus} miles on the bus. Great choice! That's only <strong>${addedCO2.toFixed(1)} kg CO₂</strong>.`;
            break;
        case 'meal_meat':
            addedCO2 = EMISSION_FACTORS.meal_meat;
            category = 'food';
            responseText = `Logged a meat-based meal. Added <strong>${addedCO2.toFixed(1)} kg CO₂</strong>. <br><small style="color:var(--primary); margin-top:5px; display:block;">💡 Tip: Swapping just one meat meal for a plant-based one saves ~2.6 kg of CO₂!</small>`;
            break;
        case 'meal_vegan':
            addedCO2 = EMISSION_FACTORS.meal_vegan;
            category = 'food';
            responseText = `Logged a vegan meal. Added only <strong>${addedCO2.toFixed(1)} kg CO₂</strong>. Awesome job keeping your footprint low!`;
            break;
        case 'energy_kwh':
            const kwh = customAmount || 5;
            addedCO2 = kwh * EMISSION_FACTORS.electricity_kwh;
            category = 'energy';
            responseText = `Logged ${kwh} kWh of electricity. Added <strong>${addedCO2.toFixed(1)} kg CO₂</strong>. <br><small style="color:var(--primary); margin-top:5px; display:block;">💡 Tip: Unplugging "vampire" devices when not in use saves energy and money.</small>`;
            break;
        default:
            responseText = "I didn't quite catch that. Try using the quick action buttons!";
    }

    // Apply the calculation
    if (addedCO2 > 0) {
        state.totalCO2 += addedCO2;
        state.categories[category] += addedCO2;
        updateDashboard();
    }
    
    // Simulate Assistant "typing" delay for better UX
    setTimeout(() => addMessage(responseText), 600);
}

/**
 * Natural Language Parser (NLP) - Extracts intent from user text
 */
function parseUserInput(text) {
    const lowerText = text.toLowerCase();
    
    // Basic pattern matching for dynamic context parsing
    if (lowerText.includes('drive') || lowerText.includes('car') || lowerText.includes('drove')) {
        let match = lowerText.match(/(\d+)\s*mile/);
        processAction('commute_car', match ? parseFloat(match[1]) : 10);
    } 
    else if (lowerText.includes('bus') || lowerText.includes('transit')) {
        let match = lowerText.match(/(\d+)\s*mile/);
        processAction('commute_bus', match ? parseFloat(match[1]) : 10);
    } 
    else if (lowerText.includes('meat') || lowerText.includes('beef') || lowerText.includes('burger')) {
        processAction('meal_meat');
    } 
    else if (lowerText.includes('vegan') || lowerText.includes('plant') || lowerText.includes('salad')) {
        processAction('meal_vegan');
    } 
    else if (lowerText.includes('electricity') || lowerText.includes('energy') || lowerText.includes('kwh')) {
        let match = lowerText.match(/(\d+)\s*kwh/);
        processAction('energy_kwh', match ? parseFloat(match[1]) : 5);
    } 
    else {
        // Fallback response
        setTimeout(() => addMessage("I'm still learning! Try saying something like 'I drove 15 miles' or 'I ate a vegan meal'."), 600);
    }
}

// 4. EVENT LISTENERS
actionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        // Echo user's action
        addMessage(btn.innerText, true);
        processAction(action);
    });
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;
    
    addMessage(text, true); // Display user input
    parseUserInput(text);   // Parse and calculate
    userInput.value = '';   // Clear input
});

resetBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to reset your footprint data?")) {
        state = { totalCO2: 0, categories: { transport: 0, food: 0, energy: 0 } };
        updateDashboard();
        addMessage("Data has been completely reset. Let's start fresh!");
    }
});

// Initialize the dashboard on load
updateDashboard();
