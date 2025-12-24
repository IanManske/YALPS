# YALPS [![](https://badgen.net/npm/v/yalps)](https://www.npmjs.com/package/yalps) [![](https://badgen.net/npm/license/yalps)](https://github.com/IanManske/YALPS/blob/main/LICENSE) [![](https://deno.bundlejs.com/badge?q=yalps)](https://bundlejs.com/?q=yalps)

## What is This (For)?

This is **Yet Another Linear Programming Solver (YALPS)**. It is intended as a performant, lightweight linear programming (LP) solver geared towards small LP problems. It can solve non-integer, integer, and mixed integer LP problems.
While webassembly ports of existing solvers perform well, they tend to have larger bundle sizes and may be overkill for your use case. YALPS is the alternative for the browser featuring a small [bundle size](https://bundlephobia.com/package/yalps).

YALPS is a rewrite of [jsLPSolver](https://www.npmjs.com/package/javascript-lp-solver). The people there have made a great and easy to use solver. However, the API was limited to objects only, and I saw other areas that could have been improved. You can check out [jsLPSolver](https://www.npmjs.com/package/javascript-lp-solver) for more background and information regarding LP problems.

Compared to jsLPSolver, YALPS has the following differences:

- More flexible API (e.g., support for Iterables alongside objects)
- Better performance (especially for non-integer problems, see [Performance](#Performance) for more details.)
- Good Typescript support (YALPS is written in Typescript)

On the other hand, these features from jsLPSolver were dropped:

- Unrestricted variables (might be added later)
- Multiobjective optimization
- External solvers

# Usage

## Installation

```sh
npm i yalps
```

## Import

The main solve function:

```typescript
import { solve } from "yalps"
```

Optional helper functions:

```typescript
import { lessEq, equalTo, greaterEq, inRange } from "yalps"
```

Types, as necessary:

```typescript
import { Model, Constraint, Coefficients, OptimizationDirection, Options, Solution } from "yalps"
```

## Examples

Using objects:

```typescript
const model = {
  direction: "maximize" as const,
  objective: "profit",
  constraints: {
    wood: { max: 300 },
    labor: { max: 110 }, // labor should be <= 110
    storage: lessEq(400), // you can use the helper functions instead
  },
  variables: {
    table: { wood: 30, labor: 5, profit: 1200, storage: 30 },
    dresser: { wood: 20, labor: 10, profit: 1600, storage: 50 },
  },
  integers: ["table", "dresser"], // these variables must have an integer value in the solution
}

const solution = solve(model)
// { status: "optimal", result: 14400, variables: [ ["table", 8], ["dresser", 3] ] }
```

Iterables and objects can be mixed and matched for the `constraints` and `variables` fields. Additionally, each variable's coefficients can be an object or an iterable. E.g.:

<!-- prettier-ignore-start -->

```typescript
const constraints = new Map<string, Constraint>()
  .set("wood", { max: 300 })
  .set("labor", lessEq(110))
  .set("storage", lessEq(400))

const dresser = new Map<string, number>()
  .set("wood", 20)
  .set("labor", 10)
  .set("profit", 1600)
  .set("storage", 50)

const model: Model = {
  direction: "maximize",
  objective: "profit",
  constraints: constraints, // is an iterable
  variables: { // kept as an object
    table: { wood: 30, labor: 5, profit: 1200, storage: 30 }, // an object
    dresser: dresser, // an iterable
  },
  integers: true, // all variables are indicated as integer
}

const solution: Solution = solve(model)
// { status: "optimal", result: 14400, variables: [ ["table", 8], ["dresser", 3] ] }
```

<!-- prettier-ignore-end -->

For more extensive documentation, use the JSDoc annotations / hover information in your editor. In particular, you probably want to take a look at the documentation comments for the `Options`, `Solution`, and `Model` types.

## In the browser

In case you need it, a minified version of the code is available under `dist/index.min.js`. When loading this file as a script, YALPS will be available as a global variable named `YALPS`:

```html
<script src="https://unpkg.com/yalps@0.6.3/dist/index.min.js"></script>
<!-- For unpkg, `dist/index.min.js` is the default, so you can choose to omit it. -->
<!-- <script src="https://unpkg.com/yalps@0.6.3"></script> -->
<script>
  const { solve } = YALPS
  /* your code */
</script>
```

Like unpkg above, a similar shorthand is also supported for jsdelivr:

```html
<script src="https://cdn.jsdelivr.net/npm/yalps@0.6.3"></script>
<!-- Same as the below -->
<!-- <script src="https://cdn.jsdelivr.net/npm/yalps@0.6.3/dist/index.min.js"></script> -->
<script>
  const { solve } = YALPS
  /* your code */
</script>
```

# Performance

While YALPS generally performs better than javascript-lp-solver, this solver is still geared towards small problems (hundreds of variables or constraints). For example, the solver keeps the full representation of the matrix in memory as a dense array. As a general rule, the number of variables and constraints should probably be a few thousand or less, and the number of integer variables should be a few hundred at the most. If your use case has large problems, it is recommended that you first benchmark and test the solver on your own before committing to using it. For very large and/or integral problems, a more professional solver is recommended, e.g. [glpk.js](https://www.npmjs.com/package/glpk.js).

Nevertheless, below are the results from some benchmarks comparing YALPS to other solvers. Each solver was run 30 times for each benchmark problem. A full garbage collection was manually triggered before starting each solver's 30 trials. The averages and standard deviations are measured in milliseconds. Slowdown is calculated as `mean / fastest mean`. The benchmarks were run on NodeJS v22.21.1. Your mileage may vary in a browser setting.

<pre>
Monster 2: 888 constraints, 924 variables, 112 integers:
┌────────────┬────────┬────────┬──────────┐
│ (index)    │ mean   │ stdDev │ slowdown │
├────────────┼────────┼────────┼──────────┤
│ YALPS      │  48.64 │ 1.23   │ 1        │
│ glpk.js    │ 107.9  │ 5.9    │ 2.22     │
│ jsLPSolver │ 162.33 │ 5.41   │ 3.34     │
└────────────┴────────┴────────┴──────────┘

Monster Problem: 600 constraints, 552 variables, 0 integers:
┌────────────┬──────┬────────┬──────────┐
│ (index)    │ mean │ stdDev │ slowdown │
├────────────┼──────┼────────┼──────────┤
│ YALPS      │ 1.39 │ 0.85   │ 1        │
│ glpk.js    │ 2.75 │ 0.16   │ 1.98     │
│ jsLPSolver │ 5.25 │ 2.23   │ 3.78     │
└────────────┴──────┴────────┴──────────┘

Vendor Selection: 1641 constraints, 1640 variables, 40 integers:
┌────────────┬────────┬────────┬──────────┐
│ (index)    │ mean   │ stdDev │ slowdown │
├────────────┼────────┼────────┼──────────┤
│ glpk.js    │  52.94 │ 1.71   │ 1        │
│ YALPS      │ 266.26 │ 2.42   │ 5.03     │
│ jsLPSolver │ 354.01 │ 9.1    │ 6.69     │
└────────────┴────────┴────────┴──────────┘

Large Farm MIP: 35 constraints, 100 variables, 100 integers:
┌────────────┬───────┬────────┬──────────┐
│ (index)    │ mean  │ stdDev │ slowdown │
├────────────┼───────┼────────┼──────────┤
│ glpk.js    │  5.34 │ 0.12   │  1       │
│ YALPS      │ 29.06 │ 1.27   │  5.45    │
│ jsLPSolver │ 53.98 │ 1.06   │ 10.12    │
└────────────┴───────┴────────┴──────────┘

AGG2: 516 constraints, 302 variables, 0 integers:
┌────────────┬──────┬────────┬──────────┐
│ (index)    │ mean │ stdDev │ slowdown │
├────────────┼──────┼────────┼──────────┤
│ YALPS      │ 1.45 │ 0.57   │ 1        │
│ glpk.js    │ 4.84 │ 0.19   │ 3.35     │
│ jsLPSolver │ 5.58 │ 2.27   │ 3.86     │
└────────────┴──────┴────────┴──────────┘

BEACONFD: 173 constraints, 262 variables, 0 integers:
┌────────────┬──────┬────────┬──────────┐
│ (index)    │ mean │ stdDev │ slowdown │
├────────────┼──────┼────────┼──────────┤
│ glpk.js    │ 1.14 │ 0.07   │ 1        │
│ YALPS      │ 2.37 │ 0.09   │ 2.07     │
│ jsLPSolver │ 4.62 │ 0.79   │ 4.04     │
└────────────┴──────┴────────┴──────────┘

SC205: 205 constraints, 203 variables, 0 integers:
┌────────────┬──────┬────────┬──────────┐
│ (index)    │ mean │ stdDev │ slowdown │
├────────────┼──────┼────────┼──────────┤
│ glpk.js    │ 1.86 │ 0.06   │ 1        │
│ YALPS      │ 6.98 │ 0.08   │ 3.75     │
│ jsLPSolver │ 9.1  │ 0.79   │ 4.89     │
└────────────┴──────┴────────┴──────────┘

SCFXM1: 330 constraints, 457 variables, 0 integers:
┌────────────┬───────┬────────┬──────────┐
│ (index)    │ mean  │ stdDev │ slowdown │
├────────────┼───────┼────────┼──────────┤
│ glpk.js    │  4.69 │ 0.29   │ 1        │
│ YALPS      │ 19.19 │ 0.19   │ 4.09     │
│ jsLPSolver │ 27.72 │ 1.87   │ 5.91     │
└────────────┴───────┴────────┴──────────┘

SCRS8: 490 constraints, 1169 variables, 0 integers:
┌────────────┬───────┬────────┬──────────┐
│ (index)    │ mean  │ stdDev │ slowdown │
├────────────┼───────┼────────┼──────────┤
│ glpk.js    │ 14.04 │ 0.19   │ 1        │
│ YALPS      │ 52.16 │ 0.69   │ 3.71     │
│ jsLPSolver │ 87.78 │ 5      │ 6.25     │
└────────────┴───────┴────────┴──────────┘

SCTAP2: 1090 constraints, 1880 variables, 0 integers:
┌────────────┬───────┬────────┬──────────┐
│ (index)    │ mean  │ stdDev │ slowdown │
├────────────┼───────┼────────┼──────────┤
│ glpk.js    │ 13.92 │ 0.18   │ 1        │
│ YALPS      │ 44.11 │ 1.56   │ 3.17     │
│ jsLPSolver │ 84.32 │ 5.42   │ 6.06     │
└────────────┴───────┴────────┴──────────┘

SHIP08S: 778 constraints, 2387 variables, 0 integers:
┌────────────┬───────┬────────┬──────────┐
│ (index)    │ mean  │ stdDev │ slowdown │
├────────────┼───────┼────────┼──────────┤
│ glpk.js    │  8.65 │ 0.28   │ 1        │
│ YALPS      │ 14.61 │ 0.89   │ 1.69     │
│ jsLPSolver │ 49.99 │ 5.49   │ 5.78     │
└────────────┴───────┴────────┴──────────┘
</pre>

The code used for these benchmarks is available under `benchmarks/`. Measuring performance isn't always straightforward, so take these synthetic benchmarks with a grain of salt. It is always recommended to benchmark for your use case. Then again, if your problems are typically of small size, then this solver should have no issue (and may be faster)!

# Maintenance/Status

This package is still being maintained (i.e., bug fixes and security updates as necessary). However, no new features are planned or being worked on at this time.
