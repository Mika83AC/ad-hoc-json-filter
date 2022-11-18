"use strict";
exports.__esModule = true;
exports.filter = void 0;
var typy_1 = require("typy");
function filter(json, filterExpressions) {
    if (!Array.isArray(json))
        return [];
    return json.filter(function (jsonEntry) { return evaluateDataEntry(jsonEntry, filterExpressions); });
}
exports.filter = filter;
function evaluateDataEntry(jsonEntry, filterExpressions) {
    var _a;
    var evalExpression = "";
    if (!jsonEntry || typeof jsonEntry !== "object")
        return false;
    for (var _i = 0, filterExpressions_1 = filterExpressions; _i < filterExpressions_1.length; _i++) {
        var expression = filterExpressions_1[_i];
        if (!expression)
            continue;
        if (expression.grp !== undefined && expression.grp === "(") {
            // Esnure previous evalExpression is a connector 
            if (evalExpression.length > 0 && (!evalExpression.endsWith('&') && !evalExpression.endsWith('|')))
                evalExpression += "&&";
            evalExpression += "(";
        }
        else if (expression.grp !== undefined && expression.grp === ")")
            evalExpression += ")";
        else if ((expression.con !== undefined && expression.con === "&&"))
            evalExpression += "&&";
        else if (expression.con !== undefined && expression.con === "||")
            evalExpression += "||";
        else if (expression.key !== undefined && expression.key.length > 0) {
            // Esnure previous evalExpression is a connector or a group open
            if (evalExpression.length > 0 && (!evalExpression.endsWith('&') && !evalExpression.endsWith('|') && !evalExpression.endsWith('(')))
                evalExpression += "&&";
            var filter_1 = expression;
            var filterValue = filter_1.val;
            var dataValue = (0, typy_1.t)(jsonEntry, filter_1.key).safeObject;
            if (filter_1.op === "=")
                evalExpression += dataValue === filterValue ? "1" : "0";
            else if (filter_1.op === "!=")
                evalExpression += dataValue !== filterValue ? "1" : "0";
            else if (filter_1.op === ">" && filterValue)
                evalExpression += dataValue > filterValue ? "1" : "0";
            else if (filter_1.op === ">=" && filterValue)
                evalExpression += dataValue >= filterValue ? "1" : "0";
            else if (filter_1.op === "<" && filterValue)
                evalExpression += dataValue < filterValue ? "1" : "0";
            else if (filter_1.op === "<=" && filterValue)
                evalExpression += dataValue <= filterValue ? "1" : "0";
            else if (filter_1.op === "cont" && Array.isArray(filterValue))
                evalExpression += dataValue.indexOf(filterValue) >= 0 ? "1" : "0";
            else if (filter_1.op === "cont" && typeof filterValue === "string")
                evalExpression += dataValue.indexOf(filterValue) >= 0 ? "1" : "0";
        }
    }
    // Now evaluate the final expression
    var expressionIsSafe = evalExpression.match(/[0&|()1]*/ig);
    if (!expressionIsSafe)
        return false;
    var result = false;
    try {
        result = eval((_a = expressionIsSafe[0]) !== null && _a !== void 0 ? _a : '0');
    }
    catch (error) {
        console.error(error);
    }
    return result;
}
