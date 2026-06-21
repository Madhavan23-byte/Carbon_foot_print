const DATA = require('./data.js');

console.log("Starting Eco-Insight V2 Test Suite...\n");

let passed = 0;
let failed = 0;

function assertEqual(testName, actual, expected) {
    if (Math.abs(actual - expected) < 0.01) {
        console.log(`✅ PASS: ${testName}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${testName}. Expected ${expected}, got ${actual}`);
        failed++;
    }
}

// 1. Regional Grid modifier
const usGrid = DATA.regions['US'].grid_kwh;
const inGrid = DATA.regions['IN'].grid_kwh;

// 2. Compute Logic - Transport (EV in US vs EV in India)
const evFactor = 0.3; // kWh per mile
const miles = 10;
assertEqual("US EV Calculation (Grid adjusted)", miles * evFactor * usGrid, 1.155);
assertEqual("IN EV Calculation (Grid adjusted)", miles * evFactor * inGrid, 2.124);

// 3. Compute Logic - Transport (Standard Gas)
assertEqual("Standard Gas Car (10m)", 10 * DATA.transport.car_gas_average.co2_per_mile, 4.04);

// 4. Compute Logic - Diet
assertEqual("Vegan vs Meat Savings", DATA.diet.meat_heavy.co2_per_meal - DATA.diet.vegan.co2_per_meal, 2.6);

// 5. Energy Logic
const kwh = 50;
assertEqual("50 kWh Energy in EU", kwh * DATA.regions['EU'].grid_kwh, 11.55);

console.log(`\nTest Summary: ${passed} Passed, ${failed} Failed`);
if (failed > 0) process.exit(1);
else process.exit(0);
