import { expressionConnector, expressionFilter, expressionGroup, filter } from "../dist/index"
// @ts-ignore
import * as fs from 'fs';

const testDataOrig: Array<unknown> = JSON.parse(fs.readFileSync('./tests/testData.json', 'utf8'));
let success = true;

function test(testData: any, filterData: Array<expressionFilter | expressionConnector | expressionGroup>, checkFunc: any) {
   const date1 = new Date();

   let result = filter(testData, filterData);
   let check = testData.filter(checkFunc);

   const date2 = new Date();

   if (result.length !== check.length)
      success = false;

   console.table([{
      result: (result.length === check.length ? "✅" : "❌"),
      resultLenth: result.length,
      checkLength: check.length,
      duration: `${date2.valueOf() - date1.valueOf()}ms`,
      expression: JSON.stringify(filterData)
   }]);
}

const testData = testDataOrig.slice(0);

// Testing single comparison operations
test(testData, [{ key: "firstName", op: "=", val: "Ingrid" }], ((x: any) => x.firstName === "Ingrid"));
test(testData, [{ key: "isActive", op: "!=", val: false }], ((x: any) => x.isActive !== false));
test(testData, [{ key: "age", op: ">", val: 15 }], ((x: any) => x.age > 15));
test(testData, [{ key: "registration", op: ">=", val: new Date("2020-01-01").toISOString() }], ((x: any) => x.registration >= new Date("2020-01-01").toISOString()));
test(testData, [{ key: "reputation", op: "<", val: 4.25 }], ((x: any) => x.reputation < 4.25));
test(testData, [{ key: "reputation", op: "<=", val: 4.25 }], ((x: any) => x.reputation <= 4.25));
test(testData, [{ key: "premium", op: "=", val: null }], ((x: any) => x.premium === null));
test(testData, [{ key: "friends", op: "cont", val: "Nadine" }], ((x: any) => x.friends.indexOf("Nadine") >= 0));
test(testData, [{ key: "address", op: "cont", val: "Colorado" }], ((x: any) => x.address.indexOf("Colorado") >= 0));
test(testData, [{ key: "firstName", op: "sw", val: "In" }], ((x: any) => x.firstName.startsWith("In")));
test(testData, [{ key: "firstName", op: "ew", val: "id" }], ((x: any) => x.firstName.endsWith("id")));
test(testData, [{ key: "undefinedTest", op: "=", val: "hallo" }], ((x: any) => x.undefinedTest === "hallo"));
test(testData, [{ key: "undefinedTest", op: "=", val: undefined }], ((x: any) => x.undefinedTest === undefined));

// Testing connectors
test(testData, [{ key: "firstName", op: "=", val: "Ingrid" }, { con: "&&" }, { key: "firstName", op: "=", val: "Justus" }], ((x: any) => x.firstName === "Ingrid" && x.firstName === "Justus"));
test(testData, [{ key: "firstName", op: "=", val: "Ingrid" }, { con: "||" }, { key: "firstName", op: "=", val: "Justus" }], ((x: any) => x.firstName === "Ingrid" || x.firstName === "Justus"));
test(testData, [{ key: "premium", op: "!=", val: null }, { con: "&&" }, { key: "isActive", op: "=", val: true }], ((x: any) => x.premium !== null && x.isActive === true));

// Testing groups
test(testData, [{ key: "age", op: ">", val: 15 }, { grp: "(" }, { key: "firstName", op: "=", val: "Ingrid" }, { con: "||" }, { key: "firstName", op: "=", val: "Justus" }, { grp: ")" }], ((x: any) => x.age > 15 && (x.firstName === "Ingrid" || x.firstName === "Justus")));

console.log("");

if (success)
   console.log("✅ All test good!")
else
   console.log("❌ Some tests failed!")

console.log("");