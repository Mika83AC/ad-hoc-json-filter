"use strict";
exports.__esModule = true;
var __1 = require("..");
var fs = require("fs");
var testData = JSON.parse(fs.readFileSync('./tests/testData.json', 'utf8'));
var success = true;
function test(testData, filterData, checkFunc) {
    var date1 = new Date();
    var result = (0, __1.filter)(testData, filterData);
    var check = testData.filter(checkFunc);
    var date2 = new Date();
    if (result.length !== check.length)
        success = false;
    console.table([{
            result: (result.length === check.length ? "✅" : "❌"),
            resultLenth: result.length,
            checkLength: check.length,
            duration: "".concat(date2.valueOf() - date1.valueOf(), "ms"),
            expression: JSON.stringify(filterData)
        }]);
}
// Testing single comparison operations
test(testData, [{ key: "firstName", op: "=", val: "Ingrid" }], (function (x) { return x.firstName === "Ingrid"; }));
test(testData, [{ key: "isActive", op: "!=", val: false }], (function (x) { return x.isActive !== false; }));
test(testData, [{ key: "age", op: ">", val: 15 }], (function (x) { return x.age > 15; }));
test(testData, [{ key: "registration", op: ">=", val: new Date("2020-01-01").toISOString() }], (function (x) { return x.registration >= new Date("2020-01-01").toISOString(); }));
test(testData, [{ key: "reputation", op: "<", val: 4.25 }], (function (x) { return x.reputation < 4.25; }));
test(testData, [{ key: "reputation", op: "<=", val: 4.25 }], (function (x) { return x.reputation <= 4.25; }));
test(testData, [{ key: "premium", op: "=", val: null }], (function (x) { return x.premium === null; }));
test(testData, [{ key: "friends", op: "cont", val: "Nadine" }], (function (x) { return x.friends.indexOf("Nadine") >= 0; }));
test(testData, [{ key: "address", op: "cont", val: "Colorado" }], (function (x) { return x.address.indexOf("Colorado") >= 0; }));
test(testData, [{ key: "undefinedTest", op: "=", val: "hallo" }], (function (x) { return x.undefinedTest === "hallo"; }));
test(testData, [{ key: "undefinedTest", op: "=", val: undefined }], (function (x) { return x.undefinedTest === undefined; }));
// Testing connectors
test(testData, [{ key: "firstName", op: "=", val: "Ingrid" }, { con: "&&" }, { key: "firstName", op: "=", val: "Justus" }], (function (x) { return x.firstName === "Ingrid" && x.firstName === "Justus"; }));
test(testData, [{ key: "firstName", op: "=", val: "Ingrid" }, { con: "||" }, { key: "firstName", op: "=", val: "Justus" }], (function (x) { return x.firstName === "Ingrid" || x.firstName === "Justus"; }));
test(testData, [{ key: "premium", op: "!=", val: null }, { con: "&&" }, { key: "isActive", op: "=", val: true }], (function (x) { return x.premium !== null && x.isActive === true; }));
// Testing groups
test(testData, [{ key: "age", op: ">", val: 15 }, { con: "&&" }, { grp: "(" }, { key: "firstName", op: "=", val: "Ingrid" }, { con: "||" }, { key: "firstName", op: "=", val: "Justus" }, { grp: ")" }], (function (x) { return x.age > 15 && (x.firstName === "Ingrid" || x.firstName === "Justus"); }));
console.log("");
if (success)
    console.log("✅ All test good!");
else
    console.log("❌ Some tests failed!");
console.log("");
