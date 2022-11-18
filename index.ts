import { t } from 'typy';

export function filter(json: Array<unknown>, filterExpressions: Array<expressionFilter | expressionConnector | expressionGroup>): Array<unknown> {
   if (!Array.isArray(json))
      return [];

   return json.filter(jsonEntry => evaluateDataEntry(jsonEntry, filterExpressions));
}

function evaluateDataEntry(jsonEntry: unknown, filterExpressions: Array<expressionFilter | expressionConnector | expressionGroup>): boolean {
   let evalExpression = "";

   if (!jsonEntry || typeof jsonEntry !== "object")
      return false;

   for (const expression of filterExpressions) {

      if (!expression)
         continue;

      if ((expression as expressionGroup).grp !== undefined && (expression as expressionGroup).grp === "(") {
         // Esnure previous evalExpression is a connector 
         if (evalExpression.length > 0 && (!evalExpression.endsWith('&') && !evalExpression.endsWith('|')))
            evalExpression += "&&";

         evalExpression += "(";
      }

      else if ((expression as expressionGroup).grp !== undefined && (expression as expressionGroup).grp === ")")
         evalExpression += ")";

      else if (((expression as expressionConnector).con !== undefined && (expression as expressionConnector).con === "&&"))
         evalExpression += "&&";

      else if ((expression as expressionConnector).con !== undefined && (expression as expressionConnector).con === "||")
         evalExpression += "||";

      else if ((expression as expressionFilter).key !== undefined && (expression as expressionFilter).key.length > 0) {

         // Esnure previous evalExpression is a connector or a group open
         if (evalExpression.length > 0 && (!evalExpression.endsWith('&') && !evalExpression.endsWith('|') && !evalExpression.endsWith('(')))
            evalExpression += "&&";

         const filter = (expression as expressionFilter);
         const filterValue = filter.val;
         const dataValue = t(jsonEntry, filter.key).safeObject;

         if (filter.op === "=")
            evalExpression += dataValue === filterValue ? "1" : "0";

         else if (filter.op === "!=")
            evalExpression += dataValue !== filterValue ? "1" : "0";

         else if (filter.op === ">" && filterValue)
            evalExpression += dataValue > filterValue ? "1" : "0";

         else if (filter.op === ">=" && filterValue)
            evalExpression += dataValue >= filterValue ? "1" : "0";

         else if (filter.op === "<" && filterValue)
            evalExpression += dataValue < filterValue ? "1" : "0";

         else if (filter.op === "<=" && filterValue)
            evalExpression += dataValue <= filterValue ? "1" : "0";

         else if (filter.op === "cont" && Array.isArray(filterValue))
            evalExpression += dataValue.indexOf(filterValue) >= 0 ? "1" : "0";

         else if (filter.op === "cont" && typeof filterValue === "string")
            evalExpression += dataValue.indexOf(filterValue) >= 0 ? "1" : "0";

      }

   }

   // Now evaluate the final expression
   const expressionIsSafe = evalExpression.match(/[0&|()1]*/ig);
   if (!expressionIsSafe)
      return false;

   let result = false;

   try {
      result = eval(expressionIsSafe[0] ?? '0');
   } catch (error) {
      console.error(error);
   }

   return result;
}

export type expressionFilter = {
   key: string,
   op: "=" | "!=" | "<" | "<=" | ">" | ">=" | "cont",
   val: string | number | boolean | null | undefined
}
export type expressionConnector = {
   con: "&&" | "||"
}
export type expressionGroup = {
   grp: "(" | ")"
}