# ad-hoc-json-filter
Filtering JSON data with variable filter conditions at runtime

## Why?
Filtering JSON in JS is simple. At least when you know the filter conditions at dev time. 

But when it comes to runtime (for example if you offered variable filter inputs to your users), the filter conditions (except the values itself) can't be changed as the code can't change at runtime. 

That's the point this library is intended for.

## How?
Build a array like this:

```javascript
[
  {key: 'name', op: '=', value: 'Justus}, 
  {key: 'age', op: '>=', value: 16}, 
  {key: 'age', op: '<=', value: 18}, 
  {key: 'isActive', op: '=', value: true},
  {key: 'registration', op: '<=', value: '2020-01-01'},
  {grp: '('}
    {key: 'state', op: '=', value: 'Colorado}, 
    {con: "||"}, 
    {key: 'state', op: '=', value: 'California}, 
  {grp: ')'}
]
```

That's it. Just put your JSON array and the filter array into the filter function and be happy.

## The details!
The filter array can contain three different types of filter expression objects:

```typescript
export type expressionFilter = {
    key: string; // The property name to filter
    op: "=" | "!=" | "<" | "<=" | ">" | ">=" | "cont"; // The comarison operation to perform
    val: string | number | Date | boolean | null | undefined; // The value to compare with
};
export type expressionConnector = {
    con: "&&" | "||"; // AND / OR connection
};
export type expressionGroup = {
    grp: "(" | ")"; // Opening or closing a group
};
```

The filter function takes the JSON array and the filter array and will return the filtered result:

```typescript
export declare function filter(data: Array<unknown>, filterExpression: Array<expressionFilter | expressionConnector | expressionGroup>): Array<unknown>;
```
