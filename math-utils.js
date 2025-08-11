/**
 * Counts trailing zeros in an integer using iterative method
 * @param {number} num - Input number (should be integer)
 * @param {number} maxZeros - Maximum zeros to count
 * @returns {number} Count of trailing zeros (0 to maxZeros)
 */
function countTrailingZeros(num, maxZeros) {
    if (maxZeros <= 0 || num === 0) return 0;
    
    let count = 0;
    let current = Math.abs(num);
    
    while (current % 10 === 0 && count < maxZeros) {
        count++;
        current = Math.floor(current / 10);
    }
    return count;
}

/**
 * Clips a value between specified bounds
 * @param {number} value - Input value
 * @param {number} min - Lower bound
 * @param {number} max - Upper bound
 * @returns {number} Clamped value
 */
function clip(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Determines grid line prominence rank based on trailing zeros
 * @param {number} num - Grid coordinate value
 * @returns {number} Rank value (0-3)
 */
function determineGridLineRank(num) {
    if (num === 0) return 3;  // Highest rank for origin
    return countTrailingZeros(num, 2);
}

/**
 * Creates derivative function using central difference method
 * @param {Function} func - Original function
 * @returns {Function} Derivative function
 */
function derivative(func) {
    const dx = 1e-5;
    return x => (func(x + dx) - func(x - dx)) / (2 * dx);
}

/**
 * Finds function root using Newton-Raphson method
 * @param {Function} func - Target function
 * @param {number} [initialGuess=0] - Starting point
 * @param {number} [iterations=10] - Maximum iterations
 * @returns {number} Approximate root
 */
function findRoot(func, initialGuess = 0, iterations = 10) {
    let x = initialGuess;
    const df = derivative(func);
    
    for (let i = 0; i < iterations; i++) {
        const slope = df(x);
        if (Math.abs(slope) < 1e-7) break;  // Prevent division by zero
        
        x = x - func(x) / slope;
    }
    return x;
}

/**
 * Creates inverse function using root finding
 * @param {Function} func - Original function
 * @returns {Function} Inverse function
 */
function inverse(func) {
    return y => findRoot(x => func(x) - y);
}