// Safety check for data.js
if (typeof DATA === 'undefined') {
    console.error("Critical Error: data.js failed to load before script.js.");
    alert("Data Engine failed to load. Please refresh.");
}

const STATE_KEY = 'eco_insight_v2_state';

// V2 Default State (Now includes apiKey)
const DEFAULT_STATE = {
    settings: {
        region: 'US', 
        primaryTransport: 'car_gas_average',
        apiKey: ''
    },
    totalCO2: 0,
    points: 0,
    categories: { transport: 0, food: 0, energy: 0 },
    history: [] 
};

// State Initialization and Migration
let state = JSON.parse(localStorage.getItem(STATE_KEY)) || DEFAULT_STATE;
if(!state.settings) { state = DEFAULT_STATE; }
if(state.settings.apiKey === undefined) state.settings.apiKey = ''; // migration safety
saveState();

// -- DOM Elements Selection --
const navLinks = document.querySelectorAll('.nav-links li');
const views = document.querySelectorAll('.view');
const elTotalCo2 = document.getElementById('total-co2');
const elStatTransport = document.getElementById('stat-transport');
const elStatFood = document.getElementById('stat-food');
const elStatEnergy = document.getElementById('stat-energy');
const activityList = document.getElementById('activity-list');
const elEcoPoints = document.getElementById('eco-points');
const elRankTitle = document.getElementById('rank-title');
const elRankProgress = document.getElementById('rank-progress');
const chatHistory = document.getElementById('chat-history');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const selRegion = document.getElementById('region-select');
const selTransport = document.getElementById('primary-transport');
const elApiKey = document.getElementById('api-key');
const elApiWarning = document.getElementById('api-warning');
const btnSaveSettings = document.getElementById('save-settings-btn');
const btnHardReset = document.getElementById('hard-reset-btn');

// Chart Instances
let doughnutChartInst = null;
let trendChartInst = null;

// Chat History Context for LLM
let aiChatContext = [];

// -- SPA Routing Engine --
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const target = link.getAttribute('data-target');
        views.forEach(v => v.classList.remove('active-view'));
        document.getElementById(target).classList.add('active-view');
        
        if(target === 'dashboard-view') renderDashboardCharts();
        if(target === 'analytics-view') renderAnalyticsChart();
    });
});

// -- Gamification Logic Engine --
function updateGamification() {
    elEcoPoints.innerText = state.points;
    let rank = "Eco Beginner";
    let progress = (state.points % 100); 

    if (state.points >= 500) { rank = "Earth Guardian 🌍"; progress = 100; }
    else if (state.points >= 300) { rank = "Green Ambassador 🌳"; }
    else if (state.points >= 100) { rank = "Eco Warrior 🛡️"; }
    
    elRankTitle.innerText = rank;
    elRankProgress.style.width = `${progress}%`;
}

function awardPoints(co2Saved, msg) {
    if (co2Saved > 0) {
        const pts = Math.floor(co2Saved * 15);
        state.points += pts;
        updateGamification();
    }
}

// -- Core Calculation Engine --
function processAction(type, actionKey, amount) {
    let addedCO2 = 0;
    let desc = '';
    let category = type; 
    
    const regionalGridModifier = DATA.regions[state.settings.region].grid_kwh;

    if (type === 'transport') {
        const factor = DATA.transport[actionKey].co2_per_mile;
        if (actionKey === 'car_ev') {
            addedCO2 = amount * 0.3 * regionalGridModifier;
            awardPoints(amount * (DATA.transport.car_gas_average.co2_per_mile - (0.3 * regionalGridModifier)), "Choosing an EV");
        } else {
            addedCO2 = amount * factor;
            if (actionKey === 'bus' || actionKey === 'train' || actionKey === 'bike') {
                awardPoints(amount * (DATA.transport.car_gas_average.co2_per_mile - factor), "using Eco-Transit");
            }
        }
        desc = `${amount} miles: ${DATA.transport[actionKey].label}`;
    } 
    else if (type === 'diet') {
        const factor = DATA.diet[actionKey].co2_per_meal;
        addedCO2 = amount * factor;
        desc = `${amount}x ${DATA.diet[actionKey].label}`;
        if (actionKey === 'vegan' || actionKey === 'vegetarian') {
            awardPoints(DATA.diet.average.co2_per_meal - factor, "choosing a Plant-Based meal");
        }
    } 
    else if (type === 'energy') {
        addedCO2 = amount * regionalGridModifier;
        desc = `${amount} kWh Grid Energy (${DATA.regions[state.settings.region].name})`;
    }

    state.totalCO2 += addedCO2;
    state.categories[category] += addedCO2;
    
    const logEntry = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        type: category,
        action: actionKey,
        co2: addedCO2,
        description: desc
    };
    state.history.unshift(logEntry);
    if(state.history.length > 50) state.history.pop();
    
    saveState();
    updateUI();
    if (document.getElementById('dashboard-view').classList.contains('active-view')) renderDashboardCharts();
    
    return { co2: addedCO2, desc: desc };
}


// ==========================================
// THE DYNAMIC AI ENGINE (ChatGPT Logic)
// ==========================================

const SYSTEM_INSTRUCTION = `You are Eco-Insight, a highly intelligent, conversational sustainability assistant. 
Your primary goal is to help users track and reduce their carbon footprint.
Behave like a professional human expert (like ChatGPT or Claude). You are friendly, highly engaging, and extremely knowledgeable about climate change.

CRITICAL BEHAVIOR RULES:
1. If the user mentions an activity (e.g. "I drove today", or "I cut down 10 banyan trees"), YOU MUST ACT LIKE A HUMAN AND ASK CLARIFYING QUESTIONS. Do NOT just log it immediately. For example: "Trees store massive amounts of carbon! What was the approximate height and weight of those trees?" or "How many miles did you drive?".
2. Wait for the user to answer your questions.
3. ONLY when you have enough specific information to calculate an activity's footprint mathematically, you must respond conversationally acknowledging the exact impact, AND THEN append a strict JSON block at the very end of your message to update the UI dashboard.

JSON FORMAT INSTRUCTION:
If you are logging an action, append exactly this format at the end of your text:
\`\`\`json
{"action": "log", "type": "<TYPE>", "actionKey": "<ACTION_KEY>", "amount": <NUMBER>}
\`\`\`

VALID MAPPINGS FOR JSON:
- <TYPE> must be exactly one of: 'transport', 'diet', 'energy'
- <ACTION_KEY> must be exactly one of the following based on the type:
  - For transport: 'car_gas_average', 'car_suv', 'car_ev', 'bus', 'train', 'flight_short', 'bike'
  - For diet: 'meat_heavy', 'average', 'vegetarian', 'vegan'
  - For energy (includes cutting trees/deforestation): 'electricity' (amount must be the total equivalent CO2 in kg! So if cutting trees adds 1000kg CO2, log 1000 for 'electricity' as a proxy for raw energy emissions).

Example User: "I drove 15 miles in my EV."
Example Assistant: "That's great you are driving an EV! I've calculated your 15-mile commute.
\`\`\`json
{"action": "log", "type": "transport", "actionKey": "car_ev", "amount": 15}
\`\`\`"

Do NOT output the JSON block unless you have fully clarified the details with the user.`;

async function callGeminiAPI(userText) {
    if (!state.settings.apiKey) {
        addMessage("⚠️ I cannot connect to my AI brain. Please provide your Gemini API Key in the Settings tab.", false);
        return;
    }

    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('message', 'bot-msg');
    loadingDiv.id = loadingId;
    loadingDiv.innerHTML = "<em>Analyzing context...</em>";
    chatHistory.appendChild(loadingDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    const tempContext = [...aiChatContext, { role: "user", parts: [{ text: userText }] }];

    const payload = {
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: tempContext
    };

    try {
        // Use v1beta API endpoint
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.settings.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        let aiResponseText = data.candidates[0].content.parts[0].text;
        
        aiChatContext = tempContext;
        aiChatContext.push({ role: "model", parts: [{ text: aiResponseText }] });

        document.getElementById(loadingId).remove();

        const jsonMatch = aiResponseText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            try {
                const actionData = JSON.parse(jsonMatch[1]);
                if (actionData.action === 'log') {
                    const res = processAction(actionData.type, actionData.actionKey, actionData.amount);
                    aiResponseText = aiResponseText.replace(jsonMatch[0], '').trim();
                    aiResponseText += `<br><br><span style="background:var(--primary); color:#000; padding:2px 8px; border-radius:8px; font-size:0.8rem; font-weight:bold;">SYSTEM LOG: Added ${res.co2.toFixed(2)} kg CO₂</span>`;
                }
            } catch (e) {
                console.error("JSON Error", e);
            }
        }

        const formattedText = aiResponseText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        addMessage(formattedText, false);

    } catch (error) {
        document.getElementById(loadingId).remove();
        
        // ==========================================
        // LOCAL NLP FALLBACK ENGINE (SAVES THE DEMO!)
        // ==========================================
        let fallbackText = "";
        const txt = userText.toLowerCase();
        
        if (txt.includes('mile') || txt.includes('drive') || txt.includes('drove') || txt.includes('km')) {
            let match = txt.match(/(\d+)\s*(mile|km)/);
            let dist = match ? parseFloat(match[1]) : 10;
            if (match && match[2] === 'km') dist = dist * 0.621371;
            
            let action = state.settings.primaryTransport; 
            if (txt.includes('bus')) action = 'bus';
            if (txt.includes('ev') || txt.includes('electric')) action = 'car_ev';
            if (txt.includes('flight')) action = 'flight_short';
            
            const res = processAction('transport', action, dist);
            fallbackText = `I analyzed your trip offline! Logging ${dist} miles using a ${action} added <strong>${res.co2.toFixed(2)} kg CO₂</strong>.`;
        } 
        else if (txt.includes('eat') || txt.includes('ate') || txt.includes('meal')) {
            let action = 'average';
            if (txt.includes('meat') || txt.includes('beef')) action = 'meat_heavy';
            if (txt.includes('vegan')) action = 'vegan';
            
            const res = processAction('diet', action, 1);
            fallbackText = `I analyzed your diet offline! Logging a ${action} meal added <strong>${res.co2.toFixed(2)} kg CO₂</strong>.`;
        }
        else if (txt.match(/\b(hi|hello|hey)\b/i)) {
            fallbackText = "Hello! My cloud connection is slightly unstable right now, but my local backup brain is active. Tell me about your commute or meals to track your footprint!";
        }
        else {
            fallbackText = "I couldn't calculate that offline. Try being specific, like: 'I drove my EV 15 miles' or 'I ate a vegan meal'.";
        }
        
        fallbackText += `<br><br><span style="font-size:0.75rem; color:#ff6b6b; font-family:monospace;">[API Key Blocked: ${error.message}]</span>`;
        addMessage(fallbackText, false);
    }
}


// -- UI Update Functions --
function addMessage(text, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(isUser ? 'user-msg' : 'bot-msg');
    msgDiv.innerHTML = text; 
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function updateUI() {
    elTotalCo2.innerText = state.totalCO2.toFixed(1);
    elStatTransport.innerText = state.categories.transport.toFixed(1) + ' kg';
    elStatFood.innerText = state.categories.food.toFixed(1) + ' kg';
    elStatEnergy.innerText = state.categories.energy.toFixed(1) + ' kg';
    
    activityList.innerHTML = '';
    if(state.history.length === 0) {
        activityList.innerHTML = '<li class="empty-state">No activities logged yet.</li>';
    } else {
        state.history.slice(0, 5).forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.description}</span> <span>+${item.co2.toFixed(1)} kg</span>`;
            activityList.appendChild(li);
        });
    }
    
    updateGamification();
    
    // API Key UI Warning
    if(!state.settings.apiKey) {
        elApiWarning.style.display = 'flex';
    } else {
        elApiWarning.style.display = 'none';
    }

    const insightText = document.getElementById('ai-insight-text');
    if (state.history.length >= 3) {
        let highestCat = 'transport';
        if (state.categories.food > state.categories[highestCat]) highestCat = 'food';
        if (state.categories.energy > state.categories[highestCat]) highestCat = 'energy';
        
        let insightMsg = `Your highest emission category is currently <strong>${highestCat.toUpperCase()}</strong>. Focus your reduction efforts here! `;
        insightText.innerHTML = insightMsg;
    }
}

function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

// -- Chart.js Integration --
function renderDashboardCharts() {
    const ctx = document.getElementById('footprintDoughnut');
    if(!ctx) return;
    if(doughnutChartInst) doughnutChartInst.destroy();
    
    const dataVals = [state.categories.transport, state.categories.food, state.categories.energy];
    const allZero = dataVals.every(v => v === 0);
    
    doughnutChartInst = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Transport', 'Diet', 'Energy'],
            datasets: [{
                data: allZero ? [1,1,1] : dataVals,
                backgroundColor: allZero ? ['#1e293b','#1e293b','#1e293b'] : ['#3b82f6', '#10b981', '#f59e0b'],
                borderWidth: 0,
                cutout: '80%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: !allZero } },
            animation: { animateScale: true }
        }
    });
}

function renderAnalyticsChart() {
    const ctx = document.getElementById('trendChart');
    if(!ctx) return;
    if(trendChartInst) trendChartInst.destroy();
    
    const dates = {};
    [...state.history].reverse().forEach(h => {
        if(!dates[h.date]) dates[h.date] = 0;
        dates[h.date] += h.co2;
    });
    
    const labels = Object.keys(dates).slice(-7); 
    const data = labels.map(l => dates[l]);
    
    trendChartInst = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['No Data'],
            datasets: [{
                label: 'Daily CO₂ (kg)',
                data: data.length ? data : [0],
                backgroundColor: '#10b981',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            },
            plugins: {
                legend: { labels: { color: '#f8fafc' } }
            }
        }
    });
}

// -- Event Listeners --
chatForm.addEventListener('submit', e => {
    e.preventDefault();
    const txt = userInput.value.trim();
    if(!txt) return;
    
    addMessage(txt, true);
    callGeminiAPI(txt); // Call the dynamic LLM!
    userInput.value = '';
});

// Settings Events
function loadSettingsUI() {
    selRegion.value = state.settings.region;
    selTransport.value = state.settings.primaryTransport;
    elApiKey.value = state.settings.apiKey;
}

btnSaveSettings.addEventListener('click', () => {
    state.settings.region = selRegion.value;
    state.settings.primaryTransport = selTransport.value;
    state.settings.apiKey = elApiKey.value.trim();
    saveState();
    updateUI();
    
    navLinks[1].click(); 
    addMessage(`⚙️ Configuration Updated! The AI Assistant is now synced with your settings and API key.`);
});

btnHardReset.addEventListener('click', () => {
    if(confirm("DANGER: Are you sure you want to completely erase all data? This cannot be undone.")) {
        state = DEFAULT_STATE;
        saveState();
        location.reload();
    }
});

// Initialize App
loadSettingsUI();
updateUI();
renderDashboardCharts();
