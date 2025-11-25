const CircuitBreaker = require("opossum");
const axios = require("axios");

// Function to wrap
async function axiosRequest(options) {
    return axios(options);
}

const breakerOptions = {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 5000
};

const breaker = new CircuitBreaker(axiosRequest, breakerOptions);

// fallback for OPEN state
breaker.fallback(() => ({
    fallback: true,
    success: false,
    message: "Room service is unavailable. Circuit Breaker OPEN."
}));

breaker.on('open', () => console.log("CIRCUIT OPENED — external service FAILED"));
breaker.on('halfOpen', () => console.log("CIRCUIT HALF-OPEN — testing service"));
breaker.on('close', () => console.log("CIRCUIT CLOSED — service recovered"));

module.exports = breaker;
