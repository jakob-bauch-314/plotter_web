/**
 * Helper function to count trailing zeros in a number for grid rendering
 * @param {number} n - Input number
 * @param {number} m - Max zeros to count
 * @returns {number} Count of trailing zeros
 */
function countTrailingZeros(n, m) {
    if (m === 0) return 0;
    if (n % 10 === 0) return countTrailingZeros(n / 10, m - 1) + 1;
    return 0;
}

function clip(x, a, b){
    if (x<a){return a}
    if (x>b){return b}
    return x;
}

/**
 * Determines grid line prominence based on number properties
 * @param {number} n - Input number
 * @returns {number} Rank value (0-4)
 */
function determineGridLineRank(n) {
    if (n < 0) return countTrailingZeros(-n, 2);
    if (n === 0) return 3;  // Special rank for origin
    return countTrailingZeros(n, 2);
}


function differential(f){
    const d = 0.00001;
    return function(x) {
        return (f(x+d)-f(x))/d
    }
}

function root(f){
    var x = 0;
    for (let _ = 0; _ < 10; _++){
        var y = f(x);
        var m = differential(f)(x);
        x = x - y/m;
    }
    return x;
}

function inverse(f){
    return function(y){return root(x => f(x) - y)}
}