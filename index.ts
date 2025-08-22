// Performance optimizations: Property access caching, object pooling, and micro-optimizations
// Compile filter expressions to functions for better performance

type CompiledExpression = (data: any) => boolean;

// Cache for compiled property access functions
const propertyAccessCache = new Map<string, (obj: any) => any>();

// Pre-compile property access functions for better performance
function createPropertyAccessor(path: string): (obj: any) => any {
   if (propertyAccessCache.has(path)) {
      return propertyAccessCache.get(path)!;
   }

   if (path.indexOf('.') === -1) {
      // Simple property access - fastest path
      const accessor = (obj: any) => obj?.[path];
      propertyAccessCache.set(path, accessor);
      return accessor;
   }

   // Complex nested path - compile to function
   const keys = path.split('.');
   const accessor = (obj: any) => {
      let current = obj;
      for (let i = 0; i < keys.length; i++) {
         if (current == null) return undefined;
         current = current[keys[i]!];
      }
      return current;
   };

   propertyAccessCache.set(path, accessor);
   return accessor;
}

// Object pool for evaluation stack
class EvaluationStack {
   private values: boolean[] = [];
   private operators: string[] = [];
   private valueIndex = 0;
   private operatorIndex = 0;

   reset(): void {
      this.valueIndex = 0;
      this.operatorIndex = 0;
   }

   pushValue(value: boolean): void {
      this.values[this.valueIndex++] = value;
   }

   popValue(): boolean {
      return this.values[--this.valueIndex]!;
   }

   pushOperator(op: string): void {
      this.operators[this.operatorIndex++] = op;
   }

   popOperator(): string {
      return this.operators[--this.operatorIndex]!;
   }

   hasValues(): boolean {
      return this.valueIndex >= 2;
   }

   hasOperators(): boolean {
      return this.operatorIndex > 0;
   }

   getLastOperator(): string | undefined {
      return this.operatorIndex > 0 ? this.operators[this.operatorIndex - 1] : undefined;
   }

   getResult(): boolean {
      return this.valueIndex > 0 ? this.values[0]! : true;
   }
}

// Global evaluation stack pool
const evaluationStackPool: EvaluationStack[] = [];
const maxPoolSize = 10;

function getEvaluationStack(): EvaluationStack {
   if (evaluationStackPool.length > 0) {
      const stack = evaluationStackPool.pop()!;
      stack.reset();
      return stack;
   }
   return new EvaluationStack();
}

function releaseEvaluationStack(stack: EvaluationStack): void {
   if (evaluationStackPool.length < maxPoolSize) {
      evaluationStackPool.push(stack);
   }
}

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

// Optimized comparison functions with fast paths
const createComparisonFunction = (() => {
   // Pre-compile comparison functions for common cases
   const comparisonCache = new Map<string, (dataValue: any, filterValue: any) => boolean>();

   return (op: string): (dataValue: any, filterValue: any) => boolean => {
      if (comparisonCache.has(op)) {
         return comparisonCache.get(op)!;
      }

      let compareFn: (dataValue: any, filterValue: any) => boolean;

      switch (op) {
         case '=':
            compareFn = (dataValue, filterValue) => dataValue === filterValue;
            break;
         case '!=':
            compareFn = (dataValue, filterValue) => dataValue !== filterValue;
            break;
         case '>':
            compareFn = (dataValue, filterValue) => filterValue != null && dataValue > filterValue;
            break;
         case '>=':
            compareFn = (dataValue, filterValue) => filterValue != null && dataValue >= filterValue;
            break;
         case '<':
            compareFn = (dataValue, filterValue) => filterValue != null && dataValue < filterValue;
            break;
         case '<=':
            compareFn = (dataValue, filterValue) => filterValue != null && dataValue <= filterValue;
            break;
         case 'cont':
            compareFn = (dataValue, filterValue) => {
               if (Array.isArray(dataValue)) {
                  return dataValue.indexOf(filterValue) >= 0;
               }
               if (typeof dataValue === 'string' && typeof filterValue === 'string') {
                  return dataValue.indexOf(filterValue) >= 0;
               }
               return false;
            };
            break;
         case 'sw':
            compareFn = (dataValue, filterValue) =>
               typeof dataValue === 'string' &&
               typeof filterValue === 'string' &&
               dataValue.startsWith(filterValue);
            break;
         case 'ew':
            compareFn = (dataValue, filterValue) =>
               typeof dataValue === 'string' &&
               typeof filterValue === 'string' &&
               dataValue.endsWith(filterValue);
            break;
         default:
            compareFn = () => false;
      }

      comparisonCache.set(op, compareFn);
      return compareFn;
   };
})();

// Type coercion optimization - avoid repeated type checking
function coerceValue(dataValue: any, filterValue: any): any {
   // Fast path for exact type matches
   if (typeof dataValue === typeof filterValue) {
      return dataValue;
   }

   // Only coerce when filter value is string and data value is not
   if (typeof filterValue === 'string' && typeof dataValue !== 'string') {
      if (dataValue === null) {
         return 'null';
      } else if (typeof dataValue === 'number' || typeof dataValue === 'boolean' || typeof dataValue === 'bigint') {
         return dataValue.toString();
      } else if (dataValue instanceof Date) {
         return dataValue.toISOString();
      }
   }

   return dataValue;
}

// Helper function to safely get nested property values (legacy compatibility)
function getNestedProperty(obj: any, path: string): any {
   const accessor = createPropertyAccessor(path);
   return accessor(obj);
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
            func: createOptimizedFilterFunction(filter)
         });
         lastWasCondition = true;
      }
   }

   // Convert to evaluation function
   return (data: any) => evaluateCompiledExpressionOptimized(data, compiled);
}

// Create optimized filter function for a single condition
function createOptimizedFilterFunction(filter: expressionFilter): (data: any) => boolean {
   const { key, op, val: filterValue } = filter;

   // Pre-compile property accessor and comparison function
   const propertyAccessor = createPropertyAccessor(key);
   const compareFn = createComparisonFunction(op);

   // Return optimized function with minimal overhead
   return (data: any) => {
      const dataValue = propertyAccessor(data);
      const coercedValue = coerceValue(dataValue, filterValue);
      return compareFn(coercedValue, filterValue);
   };
}

// Operator precedence lookup table (faster than function)
const precedence: Record<string, number> = {
   '&&': 2,
   '||': 1
};

// Optimized evaluation using object pooling
function evaluateCompiledExpressionOptimized(data: any, compiled: Array<{
   type: 'condition' | 'operator' | 'group';
   func?: (data: any) => boolean;
   op?: string;
   grp?: string;
}>): boolean {
   if (compiled.length === 0) return true;

   const stack = getEvaluationStack();

   try {
      for (let i = 0; i < compiled.length; i++) {
         const item = compiled[i];
         if (!item) continue;

         if (item.type === 'condition' && item.func) {
            stack.pushValue(item.func(data));
         } else if (item.type === 'group' && item.grp === '(') {
            stack.pushOperator('(');
         } else if (item.type === 'group' && item.grp === ')') {
            // Process until we find the matching '('
            while (stack.hasOperators() && stack.getLastOperator() !== '(') {
               if (!processOperatorOptimized(stack)) return false;
            }
            stack.popOperator(); // Remove the '('
         } else if (item.type === 'operator' && item.op) {
            // Process higher or equal precedence operators
            const currentPrecedence = precedence[item.op] || 0;
            while (stack.hasOperators() &&
               stack.getLastOperator() !== '(' &&
               (precedence[stack.getLastOperator()!] || 0) >= currentPrecedence) {
               if (!processOperatorOptimized(stack)) return false;
            }
            stack.pushOperator(item.op);
         }
      }

      // Process remaining operators
      while (stack.hasOperators()) {
         if (!processOperatorOptimized(stack)) return false;
      }

      return stack.getResult();
   } finally {
      releaseEvaluationStack(stack);
   }
}

// Optimized operator processing
function processOperatorOptimized(stack: EvaluationStack): boolean {
   if (!stack.hasOperators() || !stack.hasValues()) return false;

   const op = stack.popOperator();
   const right = stack.popValue();
   const left = stack.popValue();

   if (op === '&&') {
      stack.pushValue(left && right);
   } else if (op === '||') {
      stack.pushValue(left || right);
   } else {
      return false;
   }

   return true;
}

// Batch processing optimization for very large datasets
export function filterBatch(json: Array<unknown>, filterExpressions: Array<expressionFilter | expressionConnector | expressionGroup>, batchSize = 1000): Array<unknown> {
   if (!Array.isArray(json) || json.length === 0) return [];
   if (!Array.isArray(filterExpressions) || filterExpressions.length === 0) return json;

   // For smaller arrays, use regular filter
   if (json.length < batchSize * 2) {
      return filter(json, filterExpressions);
   }

   const compiledFilter = compileFilterExpression(filterExpressions);
   if (!compiledFilter) {
      console.error('Failed to compile filter expression');
      return [];
   }

   const result: unknown[] = [];
   const batches = Math.ceil(json.length / batchSize);

   // Process in batches to improve cache locality
   for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, json.length);

      // Use a tight loop for better performance
      for (let i = start; i < end; i++) {
         if (compiledFilter(json[i])) {
            result.push(json[i]);
         }
      }
   }

   return result;
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