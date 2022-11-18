"use strict";
exports.__esModule = true;
exports.filter = void 0;
var typy_1 = require("typy");
function filter(data, filterExpression) {
    return data.filter(function (dataEntry) { return evaluateDataEntry(dataEntry, filterExpression); });
}
exports.filter = filter;
function evaluateDataEntry(dataEntry, filterExpression) {
    var evalExpression = "";
    if (!dataEntry)
        return false;
    for (var _i = 0, filterExpression_1 = filterExpression; _i < filterExpression_1.length; _i++) {
        var expression = filterExpression_1[_i];
        if (!expression)
            continue;
        if (expression.grp !== undefined && expression.grp === "(")
            evalExpression += "(";
        else if (expression.grp !== undefined && expression.grp === ")")
            evalExpression += ")";
        else if (expression.con !== undefined && expression.con === "&&")
            evalExpression += "&&";
        else if (expression.con !== undefined && expression.con === "||")
            evalExpression += "||";
        else if (expression.key !== undefined && expression.key.length > 0) {
            var filter_1 = expression;
            var filterValue = filter_1.val;
            var dataValue = (0, typy_1.t)(dataEntry, filter_1.key).safeObject;
            if (filter_1.op === "=")
                evalExpression += dataValue === filterValue ? "1" : "0";
            else if (filter_1.op === "!=")
                evalExpression += dataValue !== filterValue ? "1" : "0";
            else if (filter_1.op === ">")
                evalExpression += dataValue > filterValue ? "1" : "0";
            else if (filter_1.op === ">=")
                evalExpression += dataValue >= filterValue ? "1" : "0";
            else if (filter_1.op === "<")
                evalExpression += dataValue < filterValue ? "1" : "0";
            else if (filter_1.op === "<=")
                evalExpression += dataValue <= filterValue ? "1" : "0";
            else if (filter_1.op === "cont" && Array.isArray(filterValue))
                evalExpression += dataValue.indexOf(filterValue) >= 0 ? "1" : "0";
            else if (filter_1.op === "cont" && typeof filterValue === "string")
                evalExpression += dataValue.indexOf(filterValue) >= 0 ? "1" : "0";
        }
    }
    // Now evaluate the final expression
    var expressionIsSafe = evalExpression.match(/[01&|()]*/ig);
    if (!expressionIsSafe)
        return false;
    var result = false;
    try {
        result = eval(expressionIsSafe[0]);
    }
    catch (error) {
        console.error(error);
    }
    return result;
}
