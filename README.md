# ad-hoc-json-filter
Filtering json data with variable filter conditions at runtime

## Why?
Filtering json in JS is simple. At least when you know the filter conditions at dev time. 

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
