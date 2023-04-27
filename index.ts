import { t } from 'typy';

export function filter(json: Array<unknown>, filterExpressions: Array<expressionFilter | expressionConnector | expressionGroup>): Array<unknown> {
   if (!Array.isArray(json) || json.length === 0)
      return [];

   if (!Array.isArray(filterExpressions) || filterExpressions.length === 0)
      return json;

   try {
      evaluateDataEntry(json[0], filterExpressions, true);
   } catch (error) {
      console.error('Structure check of filter expression failed:');
      console.error(error);
      return [];
   }

   return json.filter(jsonEntry => evaluateDataEntry(jsonEntry, filterExpressions));
}

function evaluateDataEntry(jsonEntry: unknown, filterExpressions: Array<expressionFilter | expressionConnector | expressionGroup>, onlyStructCheck: boolean = false): boolean {
   let evalExpression = '';

   if (!jsonEntry || typeof jsonEntry !== 'object')
      return false;

   for (const expression of filterExpressions) {

      if (!expression)
         continue;

      if ((expression as expressionGroup).grp !== undefined && (expression as expressionGroup).grp === '(') {
         // Esnure previous evalExpression is a connector 
         if (evalExpression.length > 0 && (!evalExpression.endsWith('&') && !evalExpression.endsWith('|')))
            evalExpression += '&&';

         evalExpression += '(';
      }

      else if ((expression as expressionGroup).grp !== undefined && (expression as expressionGroup).grp === ')')
         evalExpression += ')';

      else if (((expression as expressionConnector).con !== undefined && (expression as expressionConnector).con === '&&'))
         evalExpression += '&&';

      else if ((expression as expressionConnector).con !== undefined && (expression as expressionConnector).con === '||')
         evalExpression += '||';

      else if ((expression as expressionFilter).key !== undefined && (expression as expressionFilter).key.length > 0) {

         // Esnure previous evalExpression is a connector or a group open
         if (evalExpression.length > 0 && (!evalExpression.endsWith('&') && !evalExpression.endsWith('|') && !evalExpression.endsWith('(')))
            evalExpression += '&&';

         if (onlyStructCheck) {
            evalExpression += '1';
            continue;
         }

         const filter = (expression as expressionFilter);
         const filterValue = filter.val;

         let dataValue = t(jsonEntry, filter.key).safeObject;
         const typeOfDataValue = typeof dataValue;

         // Fallback to string compare as this is better than matching apples with plums
         if (typeof filterValue === 'string' && typeOfDataValue !== 'string') {

            if (dataValue === null)
               dataValue = 'null';
            else if (typeOfDataValue === 'number' || typeOfDataValue === 'boolean' || typeOfDataValue === 'bigint')
               dataValue = dataValue.toString();
            else if (dataValue instanceof Date)
               dataValue = dataValue.toISOString();
         }

         if (filter.op === '=')
            evalExpression += dataValue === filterValue ? '1' : '0';

         else if (filter.op === '!=')
            evalExpression += dataValue !== filterValue ? '1' : '0';

         else if (filter.op === '>' && filterValue)
            evalExpression += dataValue > filterValue ? '1' : '0';

         else if (filter.op === '>=' && filterValue)
            evalExpression += dataValue >= filterValue ? '1' : '0';

         else if (filter.op === '<' && filterValue)
            evalExpression += dataValue < filterValue ? '1' : '0';

         else if (filter.op === '<=' && filterValue)
            evalExpression += dataValue <= filterValue ? '1' : '0';

         else if (filter.op === 'cont' && Array.isArray(dataValue))
            evalExpression += dataValue.indexOf(filterValue) >= 0 ? '1' : '0';

         else if (filter.op === 'cont' && typeof dataValue === 'string' && typeof filterValue === 'string')
            evalExpression += dataValue.indexOf(filterValue) >= 0 ? '1' : '0';

         else if (filter.op === 'sw' && typeof dataValue === 'string' && typeof filterValue === 'string')
            evalExpression += dataValue.startsWith(filterValue) ? '1' : '0';

         else if (filter.op === 'ew' && typeof dataValue === 'string' && typeof filterValue === 'string')
            evalExpression += dataValue.endsWith(filterValue) ? '1' : '0';

      }

   }

   // Security check if expression only contains allowed characters
   const expressionIsSafe = evalExpression.match(/[0&|()1]*/ig);
   if (!expressionIsSafe) {
      console.error(`Evaluated expression '${evalExpression}' contained invalid characters.`);
      return false;
   }

   try {
      return eval(expressionIsSafe[0] ?? '0');
   } catch (error) {
      console.error(error);
   }

   return false;
}

export type expressionFilter = {
   key: string,
   op: '=' | '!=' | '<' | '<=' | '>' | '>=' | 'cont' | 'sw' | 'ew',
   val: string | number | boolean | null | undefined
}
export type expressionConnector = {
   con: '&&' | '||'
}
export type expressionGroup = {
   grp: '(' | ')'
}