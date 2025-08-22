"use strict";
// Performance optimizations: Property access caching, object pooling, and micro-optimizations
// Compile filter expressions to functions for better performance
Object.defineProperty(exports, "__esModule", { value: true });
exports.filter = filter;
exports.filterBatch = filterBatch;
// Cache for compiled property access functions
var propertyAccessCache = new Map();
// Pre-compile property access functions for better performance
function createPropertyAccessor(path) {
    if (propertyAccessCache.has(path)) {
        return propertyAccessCache.get(path);
    }
    if (path.indexOf('.') === -1) {
        // Simple property access - fastest path
        var accessor_1 = function (obj) { return obj === null || obj === void 0 ? void 0 : obj[path]; };
        propertyAccessCache.set(path, accessor_1);
        return accessor_1;
    }
    // Complex nested path - compile to function
    var keys = path.split('.');
    var accessor = function (obj) {
        var current = obj;
        for (var i = 0; i < keys.length; i++) {
            if (current == null)
                return undefined;
            current = current[keys[i]];
        }
        return current;
    };
    propertyAccessCache.set(path, accessor);
    return accessor;
}
// Object pool for evaluation stack
var EvaluationStack = /** @class */ (function () {
    function EvaluationStack() {
        this.values = [];
        this.operators = [];
        this.valueIndex = 0;
        this.operatorIndex = 0;
    }
    EvaluationStack.prototype.reset = function () {
        this.valueIndex = 0;
        this.operatorIndex = 0;
    };
    EvaluationStack.prototype.pushValue = function (value) {
        this.values[this.valueIndex++] = value;
    };
    EvaluationStack.prototype.popValue = function () {
        return this.values[--this.valueIndex];
    };
    EvaluationStack.prototype.pushOperator = function (op) {
        this.operators[this.operatorIndex++] = op;
    };
    EvaluationStack.prototype.popOperator = function () {
        return this.operators[--this.operatorIndex];
    };
    EvaluationStack.prototype.hasValues = function () {
        return this.valueIndex >= 2;
    };
    EvaluationStack.prototype.hasOperators = function () {
        return this.operatorIndex > 0;
    };
    EvaluationStack.prototype.getLastOperator = function () {
        return this.operatorIndex > 0 ? this.operators[this.operatorIndex - 1] : undefined;
    };
    EvaluationStack.prototype.getResult = function () {
        return this.valueIndex > 0 ? this.values[0] : true;
    };
    return EvaluationStack;
}());
// Global evaluation stack pool
var evaluationStackPool = [];
var maxPoolSize = 10;
function getEvaluationStack() {
    if (evaluationStackPool.length > 0) {
        var stack = evaluationStackPool.pop();
        stack.reset();
        return stack;
    }
    return new EvaluationStack();
}
function releaseEvaluationStack(stack) {
    if (evaluationStackPool.length < maxPoolSize) {
        evaluationStackPool.push(stack);
    }
}
function filter(json, filterExpressions) {
    if (!Array.isArray(json) || json.length === 0)
        return [];
    if (!Array.isArray(filterExpressions) || filterExpressions.length === 0)
        return json;
    // Compile filter expression once for better performance
    var compiledFilter = compileFilterExpression(filterExpressions);
    if (!compiledFilter) {
        console.error('Failed to compile filter expression');
        return [];
    }
    return json.filter(compiledFilter);
}
// Optimized comparison functions with fast paths
var createComparisonFunction = (function () {
    // Pre-compile comparison functions for common cases
    var comparisonCache = new Map();
    return function (op) {
        if (comparisonCache.has(op)) {
            return comparisonCache.get(op);
        }
        var compareFn;
        switch (op) {
            case '=':
                compareFn = function (dataValue, filterValue) { return dataValue === filterValue; };
                break;
            case '!=':
                compareFn = function (dataValue, filterValue) { return dataValue !== filterValue; };
                break;
            case '>':
                compareFn = function (dataValue, filterValue) { return filterValue != null && dataValue > filterValue; };
                break;
            case '>=':
                compareFn = function (dataValue, filterValue) { return filterValue != null && dataValue >= filterValue; };
                break;
            case '<':
                compareFn = function (dataValue, filterValue) { return filterValue != null && dataValue < filterValue; };
                break;
            case '<=':
                compareFn = function (dataValue, filterValue) { return filterValue != null && dataValue <= filterValue; };
                break;
            case 'cont':
                compareFn = function (dataValue, filterValue) {
                    if (Array.isArray(dataValue)) {
                        return dataValue.indexOf(filterValue) >= 0;
                    }
                    if (typeof dataValue === 'string' && typeof filterValue === 'string') {
                        return dataValue.indexOf(filterValue) >= 0;
                    }
                    return false;
                };
                break;
            case 'sw':
                compareFn = function (dataValue, filterValue) {
                    return typeof dataValue === 'string' &&
                        typeof filterValue === 'string' &&
                        dataValue.startsWith(filterValue);
                };
                break;
            case 'ew':
                compareFn = function (dataValue, filterValue) {
                    return typeof dataValue === 'string' &&
                        typeof filterValue === 'string' &&
                        dataValue.endsWith(filterValue);
                };
                break;
            default:
                compareFn = function () { return false; };
        }
        comparisonCache.set(op, compareFn);
        return compareFn;
    };
})();
// Type coercion optimization - avoid repeated type checking
function coerceValue(dataValue, filterValue) {
    // Fast path for exact type matches
    if (typeof dataValue === typeof filterValue) {
        return dataValue;
    }
    // Only coerce when filter value is string and data value is not
    if (typeof filterValue === 'string' && typeof dataValue !== 'string') {
        if (dataValue === null) {
            return 'null';
        }
        else if (typeof dataValue === 'number' || typeof dataValue === 'boolean' || typeof dataValue === 'bigint') {
            return dataValue.toString();
        }
        else if (dataValue instanceof Date) {
            return dataValue.toISOString();
        }
    }
    return dataValue;
}
// Helper function to safely get nested property values (legacy compatibility)
function getNestedProperty(obj, path) {
    var accessor = createPropertyAccessor(path);
    return accessor(obj);
}
// Compile filter expressions to functions for better performance
function compileFilterExpression(filterExpressions) {
    if (!filterExpressions || filterExpressions.length === 0) {
        return function () { return true; };
    }
    // Build an array of condition functions and operators
    var compiled = [];
    var lastWasCondition = false;
    for (var _i = 0, filterExpressions_1 = filterExpressions; _i < filterExpressions_1.length; _i++) {
        var expression = filterExpressions_1[_i];
        if (!expression)
            continue;
        if (expression.grp !== undefined) {
            var grp = expression.grp;
            // Add implicit AND before opening group if needed
            if (grp === '(' && lastWasCondition) {
                compiled.push({
                    type: 'operator',
                    op: '&&'
                });
            }
            compiled.push({
                type: 'group',
                grp: grp
            });
            lastWasCondition = (grp === ')');
        }
        else if (expression.con !== undefined) {
            compiled.push({
                type: 'operator',
                op: expression.con
            });
            lastWasCondition = false;
        }
        else if (expression.key !== undefined) {
            var filter_1 = expression;
            // Add implicit AND between consecutive conditions
            if (lastWasCondition) {
                compiled.push({
                    type: 'operator',
                    op: '&&'
                });
            }
            compiled.push({
                type: 'condition',
                func: createOptimizedFilterFunction(filter_1)
            });
            lastWasCondition = true;
        }
    }
    // Convert to evaluation function
    return function (data) { return evaluateCompiledExpressionOptimized(data, compiled); };
}
// Create optimized filter function for a single condition
function createOptimizedFilterFunction(filter) {
    var key = filter.key, op = filter.op, filterValue = filter.val;
    // Pre-compile property accessor and comparison function
    var propertyAccessor = createPropertyAccessor(key);
    var compareFn = createComparisonFunction(op);
    // Return optimized function with minimal overhead
    return function (data) {
        var dataValue = propertyAccessor(data);
        var coercedValue = coerceValue(dataValue, filterValue);
        return compareFn(coercedValue, filterValue);
    };
}
// Operator precedence lookup table (faster than function)
var precedence = {
    '&&': 2,
    '||': 1
};
// Optimized evaluation using object pooling
function evaluateCompiledExpressionOptimized(data, compiled) {
    if (compiled.length === 0)
        return true;
    var stack = getEvaluationStack();
    try {
        for (var i = 0; i < compiled.length; i++) {
            var item = compiled[i];
            if (!item)
                continue;
            if (item.type === 'condition' && item.func) {
                stack.pushValue(item.func(data));
            }
            else if (item.type === 'group' && item.grp === '(') {
                stack.pushOperator('(');
            }
            else if (item.type === 'group' && item.grp === ')') {
                // Process until we find the matching '('
                while (stack.hasOperators() && stack.getLastOperator() !== '(') {
                    if (!processOperatorOptimized(stack))
                        return false;
                }
                stack.popOperator(); // Remove the '('
            }
            else if (item.type === 'operator' && item.op) {
                // Process higher or equal precedence operators
                var currentPrecedence = precedence[item.op] || 0;
                while (stack.hasOperators() &&
                    stack.getLastOperator() !== '(' &&
                    (precedence[stack.getLastOperator()] || 0) >= currentPrecedence) {
                    if (!processOperatorOptimized(stack))
                        return false;
                }
                stack.pushOperator(item.op);
            }
        }
        // Process remaining operators
        while (stack.hasOperators()) {
            if (!processOperatorOptimized(stack))
                return false;
        }
        return stack.getResult();
    }
    finally {
        releaseEvaluationStack(stack);
    }
}
// Optimized operator processing
function processOperatorOptimized(stack) {
    if (!stack.hasOperators() || !stack.hasValues())
        return false;
    var op = stack.popOperator();
    var right = stack.popValue();
    var left = stack.popValue();
    if (op === '&&') {
        stack.pushValue(left && right);
    }
    else if (op === '||') {
        stack.pushValue(left || right);
    }
    else {
        return false;
    }
    return true;
}
// Batch processing optimization for very large datasets
function filterBatch(json, filterExpressions, batchSize) {
    if (batchSize === void 0) { batchSize = 1000; }
    if (!Array.isArray(json) || json.length === 0)
        return [];
    if (!Array.isArray(filterExpressions) || filterExpressions.length === 0)
        return json;
    // For smaller arrays, use regular filter
    if (json.length < batchSize * 2) {
        return filter(json, filterExpressions);
    }
    var compiledFilter = compileFilterExpression(filterExpressions);
    if (!compiledFilter) {
        console.error('Failed to compile filter expression');
        return [];
    }
    var result = [];
    var batches = Math.ceil(json.length / batchSize);
    // Process in batches to improve cache locality
    for (var batchIndex = 0; batchIndex < batches; batchIndex++) {
        var start = batchIndex * batchSize;
        var end = Math.min(start + batchSize, json.length);
        // Use a tight loop for better performance
        for (var i = start; i < end; i++) {
            if (compiledFilter(json[i])) {
                result.push(json[i]);
            }
        }
    }
    return result;
}
