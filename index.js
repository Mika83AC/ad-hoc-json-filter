"use strict";
// Performance optimizations: Removed typy dependency, use direct property access
// Compile filter expressions to functions for better performance
Object.defineProperty(exports, "__esModule", { value: true });
exports.filter = filter;
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
// Helper function to safely get nested property values
function getNestedProperty(obj, path) {
    if (!obj || typeof obj !== 'object')
        return undefined;
    var keys = path.split('.');
    var current = obj;
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
        var key = keys_1[_i];
        if (current == null || typeof current !== 'object') {
            return undefined;
        }
        current = current[key];
    }
    return current;
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
                func: createFilterFunction(filter_1)
            });
            lastWasCondition = true;
        }
    }
    // Convert to evaluation function
    return function (data) { return evaluateCompiledExpression(data, compiled); };
}
// Create optimized filter function for a single condition
function createFilterFunction(filter) {
    var key = filter.key, op = filter.op, filterValue = filter.val;
    return function (data) {
        var dataValue = getNestedProperty(data, key);
        // Type coercion for better comparison (same logic as before but optimized)
        if (typeof filterValue === 'string' && typeof dataValue !== 'string') {
            if (dataValue === null) {
                dataValue = 'null';
            }
            else if (typeof dataValue === 'number' || typeof dataValue === 'boolean' || typeof dataValue === 'bigint') {
                dataValue = dataValue.toString();
            }
            else if (dataValue instanceof Date) {
                dataValue = dataValue.toISOString();
            }
        }
        switch (op) {
            case '=':
                return dataValue === filterValue;
            case '!=':
                return dataValue !== filterValue;
            case '>':
                return filterValue != null && dataValue > filterValue;
            case '>=':
                return filterValue != null && dataValue >= filterValue;
            case '<':
                return filterValue != null && dataValue < filterValue;
            case '<=':
                return filterValue != null && dataValue <= filterValue;
            case 'cont':
                if (Array.isArray(dataValue)) {
                    return dataValue.indexOf(filterValue) >= 0;
                }
                if (typeof dataValue === 'string' && typeof filterValue === 'string') {
                    return dataValue.indexOf(filterValue) >= 0;
                }
                return false;
            case 'sw':
                return typeof dataValue === 'string' && typeof filterValue === 'string' && dataValue.startsWith(filterValue);
            case 'ew':
                return typeof dataValue === 'string' && typeof filterValue === 'string' && dataValue.endsWith(filterValue);
            default:
                return false;
        }
    };
}
// Optimized evaluation without string building and eval
function evaluateCompiledExpression(data, compiled) {
    if (compiled.length === 0)
        return true;
    // Use a stack-based approach for evaluation
    var values = [];
    var operators = [];
    for (var _i = 0, compiled_1 = compiled; _i < compiled_1.length; _i++) {
        var item = compiled_1[_i];
        if (item.type === 'condition' && item.func) {
            values.push(item.func(data));
        }
        else if (item.type === 'group' && item.grp === '(') {
            operators.push('(');
        }
        else if (item.type === 'group' && item.grp === ')') {
            // Process until we find the matching '('
            while (operators.length > 0 && operators[operators.length - 1] !== '(') {
                if (!processOperator(values, operators))
                    return false;
            }
            operators.pop(); // Remove the '('
        }
        else if (item.type === 'operator' && item.op) {
            // Process higher or equal precedence operators
            while (operators.length > 0 &&
                operators[operators.length - 1] !== '(' &&
                getPrecedence(operators[operators.length - 1]) >= getPrecedence(item.op)) {
                if (!processOperator(values, operators))
                    return false;
            }
            operators.push(item.op);
        }
    }
    // Process remaining operators
    while (operators.length > 0) {
        if (!processOperator(values, operators))
            return false;
    }
    return values.length > 0 && values[0] !== undefined ? values[0] : true;
}
// Helper function to get operator precedence
function getPrecedence(op) {
    if (op === '&&')
        return 2;
    if (op === '||')
        return 1;
    return 0;
}
// Helper function to process operators
function processOperator(values, operators) {
    if (operators.length === 0 || values.length < 2)
        return false;
    var op = operators.pop();
    var right = values.pop();
    var left = values.pop();
    if (op === '&&') {
        values.push(left && right);
    }
    else if (op === '||') {
        values.push(left || right);
    }
    else {
        return false;
    }
    return true;
}
