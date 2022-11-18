# ad-hoc-json-filter
Filtering JSON data with variable filter conditions at runtime

## Why?
Filtering JSON in JS is simple. At least when you know the filter conditions at dev time. 

But when it comes to runtime (for example if you offered variable filter inputs to your users), the filter conditions (except the values itself) can't be changed as the code can't change at runtime. 

That's the point this library is intended for.

## How?
Build an array like this:

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
The filter function takes a JSON array and a filter array and will return the filtered result:

```typescript
function filter(data: Array<jsonLikeObject>, filterExpression: Array<expressionFilter | expressionConnector | expressionGroup>): Array<jsonLikeObject>;
```

The JSON array must contain JSON like data:
```typescript
export type jsonLikeObject = {
   [key: string]: string | number | boolean | Array<jsonLikeObject> | null
}
```

The filter array can contain three different types of filter expressions:

```typescript
type expressionFilter = {
    key: string; // The property name to filter
    op: "=" | "!=" | "<" | "<=" | ">" | ">=" | "cont"; // The comarison operation to perform
    val: string | number | boolean | null; // The value to compare with
};
type expressionConnector = {
    con: "&&" | "||"; // AND / OR connection
};
type expressionGroup = {
    grp: "(" | ")"; // Opening or closing a group
};
```

If you don't pass a "expressionConnector" between each "expressionFilter", they will automatically be connect with AND logic.


And always remember: shit in, shit out :)
