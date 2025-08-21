const { filter } = require('./index.js');
const fs = require('fs');

// Load test data
const testData = JSON.parse(fs.readFileSync('./tests/testData.json', 'utf8'));

console.log(`Running performance tests with ${testData.length} records...`);
console.log('');

function benchmark(name, filterExpression, iterations = 10) {
    const times = [];
    
    // Warmup
    for (let i = 0; i < 3; i++) {
        filter(testData, filterExpression);
    }
    
    // Actual benchmarking
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const result = filter(testData, filterExpression);
        const end = performance.now();
        times.push(end - start);
    }
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    console.log(`${name}:`);
    console.log(`  Average: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
    console.log(`  Results: ${filter(testData, filterExpression).length} records`);
    console.log('');
}

// Simple filter
benchmark('Simple equality filter', [
    { key: "firstName", op: "=", val: "Ingrid" }
]);

// Complex filter with multiple conditions
benchmark('Complex filter with AND/OR', [
    { key: "age", op: ">", val: 20 },
    { con: "&&" },
    { grp: "(" },
    { key: "isActive", op: "=", val: true },
    { con: "||" },
    { key: "premium", op: "!=", val: null },
    { grp: ")" }
]);

// String operations
benchmark('String contains filter', [
    { key: "address", op: "cont", val: "Street" }
]);

// Numeric comparison
benchmark('Numeric range filter', [
    { key: "age", op: ">=", val: 18 },
    { con: "&&" },
    { key: "age", op: "<=", val: 65 }
]);

console.log('Performance testing completed!');
