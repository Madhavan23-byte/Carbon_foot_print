// Safety check for data.js
if (typeof DATA === 'undefined') {
    console.error("Critical Error: data.js failed to load before script.js.");
    alert("Data Engine failed to load. Please refresh.");
}

const STATE_KEY = 'eco_insight_v2_state';

// V2 Default State
const DEFAULT_STATE = {
    settings: {
        region: 'US', // Default to US baseline
        primaryTransport: 'car_gas_average'
    },
    totalCO2: 0,
    points: 0,
    categories: { transport: 0, food: 0, energy: 0 },
    history: [] // { id, date, type, action, co2, description }
};

// State Initialization and Migration
let state = JSON.parse(localStorage.getItem(STATE_KEY)) || DEFAULT_STATE;
if(!state.settings) { 
    state = DEFAULT_STATE; 
    localStorage.setItem(STATE_KEY, JSON.stringify(state)); 
}

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
const actionBtns = document.querySelectorAll('.action-btn');
const selRegion = document.getElementById('region-select');
const selTransport = document.getElementById('primary-transport');
const btnSaveSettings = document.getElementById('save-settings-btn');
const btnHardReset = document.getElementById('hard-reset-btn');

// Chart Instances
let doughnutChartInst = null;
let trendChartInst = null;

// -- SPA Routing Engine --
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        // Handle Active states
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Handle View toggling
        const target = link.getAttribute('data-target');
        views.forEach(v => v.classList.remove('active-view'));
        document.getElementById(target).classList.add('active-view');
        
        // Lazy-render charts to prevent sizing bugs when display is none
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
        const pts = Math.floor(co2Saved * 15); // Multiplier for psychological reward
        state.points += pts;
        addMessage(`🌟 <strong>Achievement!</strong> You earned ${pts} Eco-Points for ${msg}!`);
        updateGamification();
    }
}

// -- Core Calculation Engine (V2 using data.js) --
function processAction(type, actionKey, amount) {
    let addedCO2 = 0;
    let desc = '';
    let category = type; 
    
    // Grid modifier based on Geographic Region setting
    const regionalGridModifier = DATA.regions[state.settings.region].grid_kwh;

    if (type === 'transport') {
        const factor = DATA.transport[actionKey].co2_per_mile;
        
        if (actionKey === 'car_ev') {
            // EV calculation: Miles * kWh per mile * Regional Grid Emission
            addedCO2 = amount * 0.3 * regionalGridModifier;
            awardPoints(amount * (DATA.transport.car_gas_average.co2_per_mile - (0.3 * regionalGridModifier)), "Choosing an EV over a Gas Car");
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

    // Update Global State
    state.totalCO2 += addedCO2;
    state.categories[category] += addedCO2;
    
    // Log history array
    const logEntry = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        type: category,
        action: actionKey,
        co2: addedCO2,
        description: desc
    };
    state.history.unshift(logEntry);
    if(state.history.length > 50) state.history.pop(); // Cap history to 50 items
    
    saveState();
    updateUI();
    if (document.getElementById('dashboard-view').classList.contains('active-view')) {
        renderDashboardCharts();
    }
    
    return { co2: addedCO2, desc: desc };
}

// -- AI Assistant NLP Parser --
function parseText(text) {
    const txt = text.toLowerCase();
    
    if (txt.includes('mile') || txt.includes('drive') || txt.includes('drove') || txt.includes('km')) {
        let match = txt.match(/(\d+)\s*(mile|km)/);
        let dist = match ? parseFloat(match[1]) : 10;
        if (match && match[2] === 'km') dist = dist * 0.621371; // convert km to miles
        
        let action = state.settings.primaryTransport; // Use customized user setting
        if (txt.includes('bus')) action = 'bus';
        if (txt.includes('ev') || txt.includes('electric')) action = 'car_ev';
        if (txt.includes('bike') || txt.includes('walk')) action = 'bike';
        if (txt.includes('flight') || txt.includes('fly')) action = 'flight_short';
        
        let result = processAction('transport', action, dist);
        setTimeout(() => addMessage(`Got it! ${result.desc} added <strong>${result.co2.toFixed(2)} kg CO₂</strong>.`), 600);
    } 
    else if (txt.includes('meal') || txt.includes('ate') || txt.includes('eat') || txt.includes('food')) {
        let action = 'average';
        if (txt.includes('meat') || txt.includes('beef') || txt.includes('steak')) action = 'meat_heavy';
        if (txt.includes('vegan') || txt.includes('plant')) action = 'vegan';
        if (txt.includes('vegetarian') || txt.includes('paneer')) action = 'vegetarian';
        
        let result = processAction('diet', action, 1);
        setTimeout(() => addMessage(`Logged. ${result.desc} added <strong>${result.co2.toFixed(2)} kg CO₂</strong>.`), 600);
    }
    else {
        setTimeout(() => addMessage(`I didn't quite catch that. Try saying something like "I drove my EV 20 miles" or "I ate a vegetarian meal".`), 600);
    }
}

// -- UI Update Functions --
function addMessage(text, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(isUser ? 'user-msg' : 'bot-msg');
    msgDiv.innerHTML = text; // Allow basic HTML (bolding)
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
    
    // Dynamic AI Insights Generator
    const insightText = document.getElementById('ai-insight-text');
    if (state.history.length >= 3) {
        let highestCat = 'transport';
        if (state.categories.food > state.categories[highestCat]) highestCat = 'food';
        if (state.categories.energy > state.categories[highestCat]) highestCat = 'energy';
        
        let insightMsg = `Your highest emission category is currently <strong>${highestCat.toUpperCase()}</strong>. Focus your reduction efforts here! `;
        if (highestCat === 'transport') insightMsg += "Try carpooling or switching your Settings to 'Electric Vehicle'.";
        if (highestCat === 'food') insightMsg += "Swapping just one meat meal a day for plant-based saves massive amounts of CO2.";
        if (highestCat === 'energy') insightMsg += `Because you are in the <strong>${state.settings.region}</strong> region, unplugging unused devices is critical.`;
        
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
    
    // Group history by date
    const dates = {};
    [...state.history].reverse().forEach(h => {
        if(!dates[h.date]) dates[h.date] = 0;
        dates[h.date] += h.co2;
    });
    
    const labels = Object.keys(dates).slice(-7); // Last 7 active days
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
actionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        const action = btn.getAttribute('data-action');
        const amount = parseFloat(btn.getAttribute('data-amount'));
        
        addMessage(btn.innerText, true);
        const res = processAction(type, action, amount);
        setTimeout(() => addMessage(`Logged! Added ${res.co2.toFixed(2)} kg CO₂ from ${res.desc}.`), 400);
    });
});

chatForm.addEventListener('submit', e => {
    e.preventDefault();
    const txt = userInput.value.trim();
    if(!txt) return;
    addMessage(txt, true);
    parseText(txt);
    userInput.value = '';
});

// Settings Events
function loadSettingsUI() {
    selRegion.value = state.settings.region;
    selTransport.value = state.settings.primaryTransport;
}

btnSaveSettings.addEventListener('click', () => {
    state.settings.region = selRegion.value;
    state.settings.primaryTransport = selTransport.value;
    saveState();
    
    // Notify in Assistant
    navLinks[1].click(); // switch to assistant
    addMessage(`⚙️ Configuration Updated! Future energy logic will use the <strong>${state.settings.region}</strong> grid, and default transport is now <strong>${selTransport.options[selTransport.selectedIndex].text}</strong>.`);
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
