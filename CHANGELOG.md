# Changelog

## 1.0.13 (Performance Update)
**Major Performance Optimizations:**
- 🚀 ~70% faster execution by replacing eval() with direct function compilation
- ⚡ Removed typy dependency - zero external dependencies now
- 🔧 Compiled filter expressions for better performance on repeated filtering
- 🎯 Direct property access instead of library-based object traversal
- 📐 Stack-based evaluation for complex logical expressions
- 🧪 All existing functionality preserved with full test coverage

**Benchmark improvements:**
- Simple filters: ~2ms average (was ~7ms)
- Complex filters: ~7ms average (was ~25ms)
- String operations: ~3-4ms average (was ~12ms)

## 1.0.12
Fix for wrong deploy ... ^^

## 1.0.11
Fixed empty result on empty filter expression.

## 1.0.10
Added string compare fallback when filter is a string but data value isn't a string. See readme for details.

## 1.0.9
- added 'sw' (startsWith) and 'ew' (endsWith) comparison operators
- optimized 'cont' (contains) operator to work properly on strings and arrays

## 1.0.8
- removed npm dev dependencies from package

## 1.0.7
- same as 1.0.8, but without changelog

## 1.0.6
- just some README optimizations

## 1.0.5
- starting with changelog
- added a pre evaluation of the filters structure to avoid mass of errors if it's a invalid expression