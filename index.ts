import { t } from 'typy';

export function filter(data: Array<jsonLikeObject>, filterExpression: Array<expressionFilter | expressionConnector | expressionGroup>): Array<jsonLikeObject> {
   return data.filter(dataEntry => evaluateDataEntry(dataEntry, filterExpression));
}

function evaluateDataEntry(dataEntry: jsonLikeObject, filterExpression: Array<expressionFilter | expressionConnector | expressionGroup>): boolean {
   let evalExpression = "";

   if (!dataEntry)
      return false;

   for (const expression of filterExpression) {

      if (!expression)
         continue;

      if ((expression as expressionGroup).grp !== undefined && (expression as expressionGroup).grp === "(")
         evalExpression += "(";

      else if ((expression as expressionGroup).grp !== undefined && (expression as expressionGroup).grp === ")")
         evalExpression += ")";

      else if ((expression as expressionConnector).con !== undefined && (expression as expressionConnector).con === "&&")
         evalExpression += "&&";

      else if ((expression as expressionConnector).con !== undefined && (expression as expressionConnector).con === "||")
         evalExpression += "||";

      else if ((expression as expressionFilter).key !== undefined && (expression as expressionFilter).key.length > 0) {

         const filter = (expression as expressionFilter);
         const filterValue = filter.val;
         const dataValue = t(dataEntry, filter.key).safeObject;

         if (filter.op === "=")
            evalExpression += dataValue === filterValue ? "1" : "0";

         else if (filter.op === "!=")
            evalExpression += dataValue !== filterValue ? "1" : "0";

         else if (filter.op === ">")
            evalExpression += dataValue > filterValue ? "1" : "0";

         else if (filter.op === ">=")
            evalExpression += dataValue >= filterValue ? "1" : "0";

         else if (filter.op === "<")
            evalExpression += dataValue < filterValue ? "1" : "0";

         else if (filter.op === "<=")
            evalExpression += dataValue <= filterValue ? "1" : "0";

         else if (filter.op === "cont" && Array.isArray(filterValue))
            evalExpression += dataValue.indexOf(filterValue) >= 0 ? "1" : "0";

         else if (filter.op === "cont" && typeof filterValue === "string")
            evalExpression += dataValue.indexOf(filterValue) >= 0 ? "1" : "0";

      }

   }

   // Now evaluate the final expression
   const expressionIsSafe = evalExpression.match(/[01&|()]*/ig);
   if (!expressionIsSafe)
      return false;

   let result = false;

   try {
      result = eval(expressionIsSafe[0]);
   } catch (error) {
      console.error(error);
   }

   return result;
}

export type expressionFilter = {
   key: string,
   op: "=" | "!=" | "<" | "<=" | ">" | ">=" | "cont",
   val: string | number | boolean | null
}
export type expressionConnector = {
   con: "&&" | "||"
}
export type expressionGroup = {
   grp: "(" | ")"
}

export type jsonLikeObject = {
   [key: string]: string | number | boolean | Array<jsonLikeObject> | null
}