"use strict";
exports.__esModule = true;
exports.filter = void 0;
var typy_1 = require("typy");
function filter(json, filterExpressions) {
    if (!Array.isArray(json) || json.length === 0)
        return [];
    try {
        evaluateDataEntry(json[0], filterExpressions, true);
    }
    catch (error) {
        console.error('Structure check of filter expression failed:');
        console.error(error);
        return [];
    }
    return json.filter(function (jsonEntry) { return evaluateDataEntry(jsonEntry, filterExpressions); });
}
exports.filter = filter;
function evaluateDataEntry(jsonEntry, filterExpressions, onlyStructCheck) {
    var _a;
    if (onlyStructCheck === void 0) { onlyStructCheck = false; }
    var evalExpression = '';
    if (!jsonEntry || typeof jsonEntry !== 'object')
        return false;
    for (var _i = 0, filterExpressions_1 = filterExpressions; _i < filterExpressions_1.length; _i++) {
        var expression = filterExpressions_1[_i];
        if (!expression)
            continue;
        if (expression.grp !== undefined && expression.grp === '(') {
            // Esnure previous evalExpression is a connector 
            if (evalExpression.length > 0 && (!evalExpression.endsWith('&') && !evalExpression.endsWith('|')))
                evalExpression += '&&';
            evalExpression += '(';
        }
        else if (expression.grp !== undefined && expression.grp === ')')
            evalExpression += ')';
        else if ((expression.con !== undefined && expression.con === '&&'))
            evalExpression += '&&';
        else if (expression.con !== undefined && expression.con === '||')
            evalExpression += '||';
        else if (expression.key !== undefined && expression.key.length > 0) {
            // Esnure previous evalExpression is a connector or a group open
            if (evalExpression.length > 0 && (!evalExpression.endsWith('&') && !evalExpression.endsWith('|') && !evalExpression.endsWith('(')))
                evalExpression += '&&';
            if (onlyStructCheck) {
                evalExpression += '1';
                continue;
            }
            var filter_1 = expression;
            var filterValue = filter_1.val;
            var dataValue = (0, typy_1.t)(jsonEntry, filter_1.key).safeObject;
            if (filter_1.op === '=')
                evalExpression += dataValue === filterValue ? '1' : '0';
            else if (filter_1.op === '!=')
                evalExpression += dataValue !== filterValue ? '1' : '0';
            else if (filter_1.op === '>' && filterValue)
                evalExpression += dataValue > filterValue ? '1' : '0';
            else if (filter_1.op === '>=' && filterValue)
                evalExpression += dataValue >= filterValue ? '1' : '0';
            else if (filter_1.op === '<' && filterValue)
                evalExpression += dataValue < filterValue ? '1' : '0';
            else if (filter_1.op === '<=' && filterValue)
                evalExpression += dataValue <= filterValue ? '1' : '0';
            else if (filter_1.op === 'cont' && Array.isArray(dataValue))
                evalExpression += dataValue.indexOf(filterValue) >= 0 ? '1' : '0';
            else if (filter_1.op === 'cont' && typeof dataValue === 'string' && typeof filterValue === 'string')
                evalExpression += dataValue.indexOf(filterValue) >= 0 ? '1' : '0';
            else if (filter_1.op === 'sw' && typeof dataValue === 'string' && typeof filterValue === 'string')
                evalExpression += dataValue.startsWith(filterValue) ? '1' : '0';
            else if (filter_1.op === 'ew' && typeof dataValue === 'string' && typeof filterValue === 'string')
                evalExpression += dataValue.endsWith(filterValue) ? '1' : '0';
        }
    }
    // Security check if expression only contains allowed characters
    var expressionIsSafe = evalExpression.match(/[0&|()1]*/ig);
    if (!expressionIsSafe) {
        console.error("Evaluated expression '".concat(evalExpression, "' contained invalid characters."));
        return false;
    }
    try {
        return eval((_a = expressionIsSafe[0]) !== null && _a !== void 0 ? _a : '0');
    }
    catch (error) {
        console.error(error);
    }
    return false;
}
