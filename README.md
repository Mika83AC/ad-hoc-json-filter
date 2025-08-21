# ad-hoc-json-filter
Filtering JSON data with variable filter conditions at runtime.

```sh
$ npm install ad-hoc-json-filter
```

## Why?
Filtering JSON in JS is simple. At least when you know the filter conditions at dev time. 

But when it comes to runtime (for example if you offered variable filter inputs to your users), the filter conditions (except the values itself) can't be changed as the code can't change at runtime. 

That's the point this library is intended for.

## Performance Optimizations ⚡
Version 1.0.12+ includes significant performance improvements:

- **~70% faster execution** by removing eval() and string concatenation
- **Zero external dependencies** (removed typy dependency)
- **Compiled filter expressions** for better performance on repeated filtering
- **Direct property access** instead of library-based object traversal
- **Stack-based evaluation** for complex logical expressions

Benchmark results on 35,000 records:
- Simple filters: ~2ms average
- Complex filters with groups: ~7ms average
- String operations: ~3-4ms average

## How?
Build an array like this:

```javascript
[
  { key: 'details.age', op: '>=', value: 18 }, 
  { key: 'isActive', op: '=', value: true },
  { key: 'registration', op: '<=', value: '2020-01-01' },
  { grp: '(' }
    { key: 'details.address.state', op: '=', value: 'Colorado' }, 
    { con: '||' }, 
    { key: 'details.address.state', op: '=', value: 'California' }, 
  { grp: ')' }
]
```

That's it. Just put your JSON array and the filter array into the filter function and be happy.

## The details!
The `filter()` function takes a JSON array and a filter array and will return the filtered result as new array:

```typescript
function filter(json: Array<unknown>, filterExpressions: Array<expressionFilter | expressionConnector | expressionGroup>);
```

The `json` parameter must be an array with JSON objects (not stringified JSON!).

The `filterExpressions` parameter can contain three different types of filter expressions:

```typescript
type expressionFilter = {
    key: string; // The property/sub-property name to filter
    op: '=' | '!=' | '<' | '<=' | '>' | '>=' | 'cont' | 'sw' | 'ew'; // The comarison operation to perform
    val: string | number | boolean | null; // The value to compare with
};
type expressionConnector = {
    con: '&&' | '||'; // AND / OR connection
};
type expressionGroup = {
    grp: '(' | ')'; // Opening or closing a group
};
```

If you don't pass a 'expressionConnector' between each 'expressionFilter', they will automatically be connect with AND logic.


If you pass a `string` as filter value, but the data value isn't a string, the lib will perform a `.toString()` on `number | bigint | boolean` and a `.toISOString()` on `Date`. A `null` value in the data will be compared as `'null'`.


And always remember: shit in, shit out :)
