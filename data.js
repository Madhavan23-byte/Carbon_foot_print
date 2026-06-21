// Comprehensive Real-World Emission Factors Database
// Units are mostly in kg CO2e per unit specified

const DATA = {
    regions: {
        'US': { name: 'United States', grid_kwh: 0.385 },
        'EU': { name: 'European Union', grid_kwh: 0.231 },
        'IN': { name: 'India', grid_kwh: 0.708 },
        'GLOBAL': { name: 'Global Average', grid_kwh: 0.436 }
    },
    transport: {
        car_gas_average: { label: 'Average Gas Car', co2_per_mile: 0.404 },
        car_suv: { label: 'SUV (Gas)', co2_per_mile: 0.55 },
        car_ev: { label: 'Electric Vehicle', co2_per_mile: 0.11 }, // factors in average grid mix
        bus: { label: 'Public Bus', co2_per_mile: 0.089 },
        train: { label: 'Passenger Train', co2_per_mile: 0.04 },
        flight_short: { label: 'Short Flight (<3 hours)', co2_per_mile: 0.25 }, // per passenger mile
        bike: { label: 'Bicycle / Walk', co2_per_mile: 0 }
    },
    diet: {
        meat_heavy: { label: 'Heavy Meat Meal', co2_per_meal: 3.3 },
        average: { label: 'Average Meal', co2_per_meal: 1.8 },
        vegetarian: { label: 'Vegetarian Meal', co2_per_meal: 1.2 },
        vegan: { label: 'Vegan Meal', co2_per_meal: 0.7 }
    },
    activities: {
        streaming_hd: { label: '1 hour HD Streaming', co2: 0.05 },
        smartphone_charge: { label: 'Charge Smartphone', co2: 0.005 }
    }
};

// Export for Node.js environment (for tests), but keep safe for browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DATA;
}
