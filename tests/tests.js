"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../dist/index");
// @ts-ignore
var fs = require("fs");
var testDataOrig = JSON.parse(fs.readFileSync('./tests/testData.json', 'utf8'));
var success = true;
function test(testData, filterData, checkFunc) {
    var date1 = new Date();
    var result = (0, index_1.filter)(testData, filterData);
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
var testData = testDataOrig.slice(0);
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
test(testData, [{ key: "firstName", op: "sw", val: "In" }], (function (x) { return x.firstName.startsWith("In"); }));
test(testData, [{ key: "firstName", op: "ew", val: "id" }], (function (x) { return x.firstName.endsWith("id"); }));
test(testData, [{ key: "undefinedTest", op: "=", val: "hallo" }], (function (x) { return x.undefinedTest === "hallo"; }));
test(testData, [{ key: "undefinedTest", op: "=", val: undefined }], (function (x) { return x.undefinedTest === undefined; }));
// Testing connectors
test(testData, [{ key: "firstName", op: "=", val: "Ingrid" }, { con: "&&" }, { key: "firstName", op: "=", val: "Justus" }], (function (x) { return x.firstName === "Ingrid" && x.firstName === "Justus"; }));
test(testData, [{ key: "firstName", op: "=", val: "Ingrid" }, { con: "||" }, { key: "firstName", op: "=", val: "Justus" }], (function (x) { return x.firstName === "Ingrid" || x.firstName === "Justus"; }));
test(testData, [{ key: "premium", op: "!=", val: null }, { con: "&&" }, { key: "isActive", op: "=", val: true }], (function (x) { return x.premium !== null && x.isActive === true; }));
// Testing groups
test(testData, [{ key: "age", op: ">", val: 15 }, { grp: "(" }, { key: "firstName", op: "=", val: "Ingrid" }, { con: "||" }, { key: "firstName", op: "=", val: "Justus" }, { grp: ")" }], (function (x) { return x.age > 15 && (x.firstName === "Ingrid" || x.firstName === "Justus"); }));
// Edge Case Tests
console.log("\n=== Edge Case Tests ===");
// Edge Case 1: Empty array
test([], [{ key: "firstName", op: "=", val: "Ingrid" }], (function () { return false; })); // Empty array should always return empty
// Edge Case 2: Empty filter expressions  
test(testData.slice(0, 5), [], (function (x) { return true; })); // Empty filter should return all
// Edge Case 3: Null values in data
var testDataWithNulls = [
    { name: null, age: 25, active: true },
    { name: "John", age: null, active: false },
    { name: "Jane", age: 30, active: null }
];
test(testDataWithNulls, [{ key: "name", op: "=", val: null }], (function (x) { return x.name === null; }));
test(testDataWithNulls, [{ key: "age", op: "=", val: null }], (function (x) { return x.age === null; }));
test(testDataWithNulls, [{ key: "active", op: "=", val: null }], (function (x) { return x.active === null; }));
// Edge Case 4: Undefined values and non-existent keys
test(testDataWithNulls, [{ key: "nonExistent", op: "=", val: undefined }], (function (x) { return x.nonExistent === undefined; }));
test(testDataWithNulls, [{ key: "nonExistent", op: "!=", val: undefined }], (function (x) { return x.nonExistent !== undefined; }));
// Edge Case 5: Type coercion tests
var typeTestData = [
    { id: 1, name: "One", flag: true },
    { id: "2", name: "Two", flag: "true" },
    { id: 3, name: "Three", flag: false },
    { id: "4", name: "Four", flag: "false" }
];
test(typeTestData, [{ key: "id", op: "=", val: "1" }], (function (x) { return x.id.toString() === "1"; }));
test(typeTestData, [{ key: "flag", op: "=", val: "true" }], (function (x) { return x.flag.toString() === "true"; }));
// Edge Case 6: Nested object properties
var nestedTestData = [
    { user: { profile: { name: "Alice", age: 25 } }, active: true },
    { user: { profile: { name: "Bob", age: 30 } }, active: false },
    { user: { profile: null }, active: true },
    { user: null, active: false }
];
test(nestedTestData, [{ key: "user.profile.name", op: "=", val: "Alice" }], (function (x) { var _a, _b; return ((_b = (_a = x.user) === null || _a === void 0 ? void 0 : _a.profile) === null || _b === void 0 ? void 0 : _b.name) === "Alice"; }));
test(nestedTestData, [{ key: "user.profile.age", op: ">", val: 26 }], (function (x) { var _a, _b; return ((_b = (_a = x.user) === null || _a === void 0 ? void 0 : _a.profile) === null || _b === void 0 ? void 0 : _b.age) > 26; }));
test(nestedTestData, [{ key: "user.profile.name", op: "=", val: undefined }], (function (x) { var _a, _b; return ((_b = (_a = x.user) === null || _a === void 0 ? void 0 : _a.profile) === null || _b === void 0 ? void 0 : _b.name) === undefined; }));
// Edge Case 7: Complex grouping with mixed operators
test(testData.slice(0, 20), [
    { grp: "(" },
    { key: "age", op: "<", val: 20 },
    { con: "||" },
    { key: "age", op: ">", val: 40 },
    { grp: ")" },
    { con: "&&" },
    { key: "isActive", op: "=", val: true }
], (function (x) { return (x.age < 20 || x.age > 40) && x.isActive === true; }));
// Edge Case 8: Nested grouping
test(testData.slice(0, 20), [
    { grp: "(" },
    { key: "firstName", op: "=", val: "Gonzalez" },
    { con: "||" },
    { grp: "(" },
    { key: "age", op: ">", val: 30 },
    { con: "&&" },
    { key: "isActive", op: "=", val: false },
    { grp: ")" },
    { grp: ")" }
], (function (x) { return x.firstName === "Gonzalez" || (x.age > 30 && x.isActive === false); }));
// Edge Case 9: String operations with special characters and empty strings
var stringTestData = [
    { text: "", special: "test@domain.com" },
    { text: " ", special: "user123" },
    { text: "hello world", special: "äöü" },
    { text: "Hello World", special: "123-456-789" }
];
test(stringTestData, [{ key: "text", op: "=", val: "" }], (function (x) { return x.text === ""; }));
test(stringTestData, [{ key: "text", op: "cont", val: " " }], (function (x) { return x.text.indexOf(" ") >= 0; }));
test(stringTestData, [{ key: "special", op: "cont", val: "@" }], (function (x) { return x.special.indexOf("@") >= 0; }));
test(stringTestData, [{ key: "special", op: "sw", val: "user" }], (function (x) { return x.special.startsWith("user"); }));
test(stringTestData, [{ key: "special", op: "ew", val: "789" }], (function (x) { return x.special.endsWith("789"); }));
// Edge Case 10: Array contains with different data types
var arrayTestData = [
    { tags: ["red", "blue", "green"], numbers: [1, 2, 3] },
    { tags: ["yellow", "purple"], numbers: [4, 5] },
    { tags: [], numbers: [] },
    { tags: ["red"], numbers: [1] }
];
test(arrayTestData, [{ key: "tags", op: "cont", val: "red" }], (function (x) { return x.tags.indexOf("red") >= 0; }));
test(arrayTestData, [{ key: "numbers", op: "cont", val: 1 }], (function (x) { return x.numbers.indexOf(1) >= 0; }));
test(arrayTestData, [{ key: "tags", op: "cont", val: "nonexistent" }], (function (x) { return x.tags.indexOf("nonexistent") >= 0; }));
// Edge Case 11: Date string comparisons
var dateTestData = [
    { created: "2020-01-01T00:00:00", name: "Old" },
    { created: "2023-06-15T12:30:00", name: "Recent" },
    { created: "1999-12-31T23:59:59", name: "Ancient" }
];
test(dateTestData, [{ key: "created", op: ">", val: "2020-01-01T00:00:00" }], (function (x) { return x.created > "2020-01-01T00:00:00"; }));
test(dateTestData, [{ key: "created", op: "<=", val: "2000-01-01T00:00:00" }], (function (x) { return x.created <= "2000-01-01T00:00:00"; }));
// Edge Case 12: Numeric edge cases (zero, negative, decimal precision)
var numericTestData = [
    { value: 0, price: -10.5, score: 0.0001 },
    { value: -5, price: 0, score: 99.9999 },
    { value: 100, price: 1.1, score: -0.0001 }
];
test(numericTestData, [{ key: "value", op: "=", val: 0 }], (function (x) { return x.value === 0; }));
test(numericTestData, [{ key: "price", op: "<", val: 0 }], (function (x) { return x.price < 0; }));
test(numericTestData, [{ key: "score", op: ">", val: 0.0001 }], (function (x) { return x.score > 0.0001; }));
test(numericTestData, [{ key: "price", op: ">=", val: 0 }], (function (x) { return x.price >= 0; }));
// Edge Case 13: Boolean edge cases with type coercion
var boolTestData = [
    { active: true, enabled: "true", visible: 1 },
    { active: false, enabled: "false", visible: 0 },
    { active: null, enabled: "", visible: null }
];
test(boolTestData, [{ key: "active", op: "=", val: true }], (function (x) { return x.active === true; }));
test(boolTestData, [{ key: "active", op: "!=", val: true }], (function (x) { return x.active !== true; }));
test(boolTestData, [{ key: "enabled", op: "=", val: "true" }], (function (x) { return x.enabled === "true"; }));
// Edge Case 14: Invalid/unsupported operations should return false
test(testData.slice(0, 5), [{ key: "firstName", op: "invalid", val: "test" }], (function () { return false; }));
// Edge Case 15: Multiple consecutive conditions without explicit connectors (should use implicit AND)
test(testData.slice(0, 10), [
    { key: "isActive", op: "=", val: true },
    { key: "age", op: ">", val: 15 }
], (function (x) { return x.isActive === true && x.age > 15; }));
// Edge Case 16: Operator precedence test (AND vs OR)
test(testData.slice(0, 10), [
    { key: "age", op: ">", val: 30 },
    { con: "||" },
    { key: "firstName", op: "=", val: "Gonzalez" },
    { con: "&&" },
    { key: "isActive", op: "=", val: true }
], (function (x) { return x.age > 30 || (x.firstName === "Gonzalez" && x.isActive === true); }));
// Edge Case 17: Very large numbers
var largeNumberData = [
    { bigNum: Number.MAX_SAFE_INTEGER, smallNum: Number.MIN_SAFE_INTEGER },
    { bigNum: 9007199254740991, smallNum: -9007199254740991 },
    { bigNum: 1.7976931348623157e+308, smallNum: 2.2250738585072014e-308 }
];
test(largeNumberData, [{ key: "bigNum", op: ">", val: 1000000 }], (function (x) { return x.bigNum > 1000000; }));
test(largeNumberData, [{ key: "smallNum", op: "<", val: 0 }], (function (x) { return x.smallNum < 0; }));
// Edge Case 18: Special string values
var specialStringData = [
    { str: "null", num: "NaN", bool: "undefined" },
    { str: "true", num: "false", bool: "0" },
    { str: JSON.stringify({ nested: "object" }), num: "[1,2,3]", bool: "function() {}" }
];
test(specialStringData, [{ key: "str", op: "=", val: "null" }], (function (x) { return x.str === "null"; }));
test(specialStringData, [{ key: "str", op: "cont", val: "nested" }], (function (x) { return x.str.indexOf("nested") >= 0; }));
// Edge Case 19: Unicode and special characters
var unicodeData = [
    { emoji: "🚀", chinese: "你好", arabic: "مرحبا" },
    { emoji: "🎉", chinese: "世界", arabic: "عالم" },
    { emoji: "❤️", chinese: "测试", arabic: "اختبار" }
];
test(unicodeData, [{ key: "emoji", op: "=", val: "🚀" }], (function (x) { return x.emoji === "🚀"; }));
test(unicodeData, [{ key: "chinese", op: "cont", val: "世" }], (function (x) { return x.chinese.indexOf("世") >= 0; }));
// Edge Case 20: Mixed data types in arrays
var mixedArrayData = [
    { mixed: [1, "two", true, null, undefined] },
    { mixed: ["hello", 42, false] },
    { mixed: [] }
];
test(mixedArrayData, [{ key: "mixed", op: "cont", val: 1 }], (function (x) { return x.mixed.indexOf(1) >= 0; }));
test(mixedArrayData, [{ key: "mixed", op: "cont", val: "two" }], (function (x) { return x.mixed.indexOf("two") >= 0; }));
test(mixedArrayData, [{ key: "mixed", op: "cont", val: null }], (function (x) { return x.mixed.indexOf(null) >= 0; }));
// Edge Case 21: Very deep nested objects
var deepNestedData = [
    {
        level1: {
            level2: {
                level3: {
                    level4: {
                        level5: {
                            value: "deep"
                        }
                    }
                }
            }
        }
    },
    { level1: { level2: { level3: null } } },
    { level1: null }
];
test(deepNestedData, [{ key: "level1.level2.level3.level4.level5.value", op: "=", val: "deep" }], (function (x) { var _a, _b, _c, _d, _e; return ((_e = (_d = (_c = (_b = (_a = x.level1) === null || _a === void 0 ? void 0 : _a.level2) === null || _b === void 0 ? void 0 : _b.level3) === null || _c === void 0 ? void 0 : _c.level4) === null || _d === void 0 ? void 0 : _d.level5) === null || _e === void 0 ? void 0 : _e.value) === "deep"; }));
test(deepNestedData, [{ key: "level1.level2.level3", op: "=", val: null }], (function (x) { var _a, _b; return ((_b = (_a = x.level1) === null || _a === void 0 ? void 0 : _a.level2) === null || _b === void 0 ? void 0 : _b.level3) === null; }));
// Edge Case 22: Extreme filter complexity
test(testData.slice(0, 20), [
    { grp: "(" },
    { grp: "(" },
    { key: "age", op: ">", val: 10 },
    { con: "&&" },
    { key: "age", op: "<", val: 50 },
    { grp: ")" },
    { con: "||" },
    { grp: "(" },
    { key: "firstName", op: "sw", val: "A" },
    { con: "&&" },
    { key: "isActive", op: "=", val: false },
    { grp: ")" },
    { grp: ")" },
    { con: "&&" },
    { key: "premium", op: "!=", val: null }
], (function (x) { return ((x.age > 10 && x.age < 50) || (x.firstName.startsWith("A") && x.isActive === false)) && x.premium !== null; }));
// Edge Case 23: Filter with only groups (should handle gracefully)
test(testData.slice(0, 5), [{ grp: "(" }, { grp: ")" }], (function () { return true; }));
// Edge Case 24: Malformed filter expressions
test(testData.slice(0, 5), [{ key: "", op: "=", val: "" }], (function (x) { return x[""] === ""; }));
// Edge Case 25: Performance test with many conditions
var performanceFilter = [];
for (var i = 0; i < 20; i++) {
    if (i > 0)
        performanceFilter.push({ con: "||" });
    performanceFilter.push({ key: "firstName", op: "=", val: "Test".concat(i) });
}
test(testData.slice(0, 100), performanceFilter, (function (x) {
    for (var i = 0; i < 20; i++) {
        if (x.firstName === "Test".concat(i))
            return true;
    }
    return false;
}));
console.log("");
if (success)
    console.log("✅ All test good!");
else
    console.log("❌ Some tests failed!");
console.log("");
