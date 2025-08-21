// Performance optimizations: Removed typy dependency, use direct property access
// Compile filter expressions to functions for better performance

type CompiledExpression = (data: any) => boolean;

export function filter(json: Array<unknown>, filterExpressions: Array<expressionFilter | expressionConnector | expressionGroup>): Array<unknown> {
   if (!Array.isArray(json) || json.length === 0)
      return [];

   if (!Array.isArray(filterExpressions) || filterExpressions.length === 0)
      return json;

   // Compile filter expression once for better performance
   const compiledFilter = compileFilterExpression(filterExpressions);
   if (!compiledFilter) {
      console.error('Failed to compile filter expression');
      return [];
   }

   return json.filter(compiledFilter);
}

// Helper function to safely get nested property values
function getNestedProperty(obj: any, path: string): any {
   if (!obj || typeof obj !== 'object') return undefined;

   const keys = path.split('.');
   let current = obj;

   for (const key of keys) {
      if (current == null || typeof current !== 'object') {
         return undefined;
      }
      current = current[key];
   }

   return current;
}

// Compile filter expressions to functions for better performance
function compileFilterExpression(filterExpressions: Array<expressionFilter | expressionConnector | expressionGroup>): CompiledExpression | null {
   if (!filterExpressions || filterExpressions.length === 0) {
      return () => true;
   }

   // Build an array of condition functions and operators
   const compiled: Array<{
      type: 'condition' | 'operator' | 'group';
      func?: (data: any) => boolean;
      op?: string;
      grp?: string;
   }> = [];

   let lastWasCondition = false;

   for (const expression of filterExpressions) {
      if (!expression) continue;

      if ((expression as expressionGroup).grp !== undefined) {
         const grp = (expression as expressionGroup).grp;
         
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
      } else if ((expression as expressionConnector).con !== undefined) {
         compiled.push({
            type: 'operator',
            op: (expression as expressionConnector).con
         });
         lastWasCondition = false;
      } else if ((expression as expressionFilter).key !== undefined) {
         const filter = expression as expressionFilter;
         
         // Add implicit AND between consecutive conditions
         if (lastWasCondition) {
            compiled.push({
               type: 'operator',
               op: '&&'
            });
         }
         
         compiled.push({
            type: 'condition',
            func: createFilterFunction(filter)
         });
         lastWasCondition = true;
      }
   }

   // Convert to evaluation function
   return (data: any) => evaluateCompiledExpression(data, compiled);
}

// Create optimized filter function for a single condition
function createFilterFunction(filter: expressionFilter): (data: any) => boolean {
   const { key, op, val: filterValue } = filter;

   return (data: any) => {
      let dataValue = getNestedProperty(data, key);

      // Type coercion for better comparison (same logic as before but optimized)
      if (typeof filterValue === 'string' && typeof dataValue !== 'string') {
         if (dataValue === null) {
            dataValue = 'null';
         } else if (typeof dataValue === 'number' || typeof dataValue === 'boolean' || typeof dataValue === 'bigint') {
            dataValue = dataValue.toString();
         } else if (dataValue instanceof Date) {
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
function evaluateCompiledExpression(data: any, compiled: Array<{
   type: 'condition' | 'operator' | 'group';
   func?: (data: any) => boolean;
   op?: string;
   grp?: string;
}>): boolean {
   if (compiled.length === 0) return true;

   // Use a stack-based approach for evaluation
   const values: boolean[] = [];
   const operators: string[] = [];

   for (const item of compiled) {
      if (item.type === 'condition' && item.func) {
         values.push(item.func(data));
      } else if (item.type === 'group' && item.grp === '(') {
         operators.push('(');
      } else if (item.type === 'group' && item.grp === ')') {
         // Process until we find the matching '('
         while (operators.length > 0 && operators[operators.length - 1] !== '(') {
            if (!processOperator(values, operators)) return false;
         }
         operators.pop(); // Remove the '('
      } else if (item.type === 'operator' && item.op) {
         // Process higher or equal precedence operators
         while (operators.length > 0 &&
            operators[operators.length - 1] !== '(' &&
            getPrecedence(operators[operators.length - 1]!) >= getPrecedence(item.op)) {
            if (!processOperator(values, operators)) return false;
         }
         operators.push(item.op);
      }
   }

   // Process remaining operators
   while (operators.length > 0) {
      if (!processOperator(values, operators)) return false;
   }

   return values.length > 0 && values[0] !== undefined ? values[0] : true;
}

// Helper function to get operator precedence
function getPrecedence(op: string): number {
   if (op === '&&') return 2;
   if (op === '||') return 1;
   return 0;
}

// Helper function to process operators
function processOperator(values: boolean[], operators: string[]): boolean {
   if (operators.length === 0 || values.length < 2) return false;

   const op = operators.pop()!;
   const right = values.pop()!;
   const left = values.pop()!;

   if (op === '&&') {
      values.push(left && right);
   } else if (op === '||') {
      values.push(left || right);
   } else {
      return false;
   }

   return true;
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