const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 1. Mock Browser Environment for Node.js
global.window = {};
global.localStorage = {
    _data: {},
    getItem: function(key) { return this._data[key] || null; },
    setItem: function(key, val) { this._data[key] = String(val); }
};
global.document = {
    getElementById: () => ({ 
        classList: { add: ()=>{}, remove: ()=>{}, contains: ()=>false }, 
        style: {}, 
        innerText: '', 
        innerHTML: '',
        addEventListener: () => {},
        value: '',
        remove: () => {},
        appendChild: () => {}
    }),
    querySelectorAll: () => ({ forEach: () => {} }),
    createElement: () => ({ classList: { add: ()=>{} }, appendChild: ()=>{} })
};
global.alert = () => {};

// 2. Load and Evaluate Project Source Files
let dataCode = fs.readFileSync(path.join(__dirname, '../data.js'), 'utf8');
let scriptCode = fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8');

try {
    dataCode = dataCode.replace('const DATA', 'var DATA');
    eval(dataCode);
    // Strip Chart.js instantiation which fails in basic Node environment without DOM
    const scriptCleaned = scriptCode.replace(/"use strict";/g, '')
                                    .replace(/let state =/g, 'var state =')
                                    .replace(/let mockAiState =/g, 'var mockAiState =')
                                    .replace(/let aiChatContext =/g, 'var aiChatContext =')
                                    .replace(/new Chart\(/g, 'new Object(');
    eval(scriptCleaned);
} catch (e) {
    console.error("Failed to load scripts into test environment:", e);
    process.exit(1);
}

console.log("🚀 Running Eco-Insight Test Suite...\n");

let passed = 0;
let failed = 0;

function runTest(name, testFn) {
    try {
        testFn();
        console.log(`✅ PASS: ${name}`);
        passed++;
    } catch (e) {
        console.error(`❌ FAIL: ${name}`);
        console.error(`   ${e.message}`);
        failed++;
    }
}

// ==========================================
// TEST CASES
// ==========================================

runTest("Mathematical Engine: EV Calculation", () => {
    // processAction returns {co2, desc}
    // EV calculation = amount * 0.3 * regionalGridModifier
    // US Grid Modifier = 0.4
    state.settings.region = 'US';
    const res = processAction('transport', 'car_ev', 10);
    const expected = 10 * 0.3 * 0.385; // US Grid Modifier is 0.385
    assert.strictEqual(Math.round(res.co2 * 1000) / 1000, expected, `Expected ${expected}, got ${res.co2}`);
});

runTest("Gamification Engine: Vegan Diet Points", () => {
    state.points = 0; 
    // Average meal = 2.5 kg CO2. Vegan = 1.0 kg CO2.
    // Saved = 1.5 kg. Points = 1.5 * 15 = 22 pts.
    processAction('diet', 'vegan', 1);
    assert.ok(state.points > 0, "Points should increase when eating vegan.");
});

runTest("State Management: History Logging", () => {
    const initialHistoryLength = state.history.length;
    processAction('energy', 'electricity', 50);
    assert.strictEqual(state.history.length, initialHistoryLength + 1, "History array failed to push new log.");
    assert.strictEqual(state.history[0].type, 'energy', "History log recorded incorrect type.");
});

// ==========================================
// RESULTS
// ==========================================
console.log(`\nTest Summary: ${passed} Passed, ${failed} Failed`);
if (failed > 0) {
    process.exit(1);
}
