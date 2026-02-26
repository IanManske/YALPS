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

Nevertheless, below are the results from some benchmarks comparing YALPS to other solvers. Each solver was run 30 times for each benchmark problem. A full garbage collection was manually triggered before starting each solver's 30 trials. The averages and standard deviations are measured in milliseconds. Slowdown is calculated as `mean / fastest mean`. The benchmarks were run on NodeJS v24.13.0. Your mileage may vary in a browser setting.

<pre>
Monster 2: 888 constraints, 924 variables, 112 integers:
┌─────────────────────┬────────┬────────┬──────────┐
│ (index)             │ mean   │ stdDev │ slowdown │
├─────────────────────┼────────┼────────┼──────────┤
│ YALPS               │ 52.29  │ 3.43   │ 1        │
│ jsLPSolver (1.0.3)  │ 62.61  │ 4.72   │ 1.2      │
│ glpk.js (5.0.0)     │ 109.22 │ 2.72   │ 2.09     │
│ jsLPSolver (0.4.24) │ 150.98 │ 4.79   │ 2.89     │
└─────────────────────┴────────┴────────┴──────────┘

Monster Problem: 600 constraints, 552 variables, 0 integers:
┌─────────────────────┬──────┬────────┬──────────┐
│ (index)             │ mean │ stdDev │ slowdown │
├─────────────────────┼──────┼────────┼──────────┤
│ YALPS               │ 1.45 │ 1.01   │ 1        │
│ jsLPSolver (1.0.3)  │ 2.79 │ 0.97   │ 1.92     │
│ glpk.js (5.0.0)     │ 2.87 │ 0.3    │ 1.98     │
│ jsLPSolver (0.4.24) │ 3.31 │ 1.74   │ 2.29     │
└─────────────────────┴──────┴────────┴──────────┘

Vendor Selection: 1641 constraints, 1640 variables, 40 integers:
┌─────────────────────┬────────┬────────┬──────────┐
│ (index)             │ mean   │ stdDev │ slowdown │
├─────────────────────┼────────┼────────┼──────────┤
│ glpk.js (5.0.0)     │ 52.96  │ 0.93   │ 1        │
│ YALPS               │ 272.19 │ 2.6    │ 5.14     │
│ jsLPSolver (0.4.24) │ 385.38 │ 13.88  │ 7.28     │
│ jsLPSolver (1.0.3)  │ 395.69 │ 17.89  │ 7.47     │
└─────────────────────┴────────┴────────┴──────────┘

Large Farm MIP: 35 constraints, 100 variables, 100 integers:
┌─────────────────────┬───────┬────────┬──────────┐
│ (index)             │ mean  │ stdDev │ slowdown │
├─────────────────────┼───────┼────────┼──────────┤
│ glpk.js (5.0.0)     │ 5.24  │ 0.3    │ 1        │
│ YALPS               │ 28.88 │ 1      │ 5.51     │
│ jsLPSolver (1.0.3)  │ 39.62 │ 1.62   │ 7.56     │
│ jsLPSolver (0.4.24) │ 53.85 │ 1.28   │ 10.27    │
└─────────────────────┴───────┴────────┴──────────┘

AGG2: 516 constraints, 302 variables, 0 integers:
┌─────────────────────┬──────┬────────┬──────────┐
│ (index)             │ mean │ stdDev │ slowdown │
├─────────────────────┼──────┼────────┼──────────┤
│ YALPS               │ 1.44 │ 0.44   │ 1        │
│ jsLPSolver (0.4.24) │ 3.52 │ 1.35   │ 2.44     │
│ jsLPSolver (1.0.3)  │ 4.6  │ 1.2    │ 3.2      │
│ glpk.js (5.0.0)     │ 4.98 │ 0.1    │ 3.46     │
└─────────────────────┴──────┴────────┴──────────┘

BEACONFD: 173 constraints, 262 variables, 0 integers:
┌─────────────────────┬──────┬────────┬──────────┐
│ (index)             │ mean │ stdDev │ slowdown │
├─────────────────────┼──────┼────────┼──────────┤
│ glpk.js (5.0.0)     │ 1.19 │ 0.08   │ 1        │
│ YALPS               │ 2.38 │ 0.03   │ 2        │
│ jsLPSolver (0.4.24) │ 4.19 │ 0.44   │ 3.53     │
│ jsLPSolver (1.0.3)  │ 4.49 │ 0.41   │ 3.79     │
└─────────────────────┴──────┴────────┴──────────┘

SC205: 205 constraints, 203 variables, 0 integers:
┌─────────────────────┬──────┬────────┬──────────┐
│ (index)             │ mean │ stdDev │ slowdown │
├─────────────────────┼──────┼────────┼──────────┤
│ glpk.js (5.0.0)     │ 1.9  │ 0.07   │ 1        │
│ YALPS               │ 6.94 │ 0.03   │ 3.66     │
│ jsLPSolver (0.4.24) │ 9.29 │ 1.45   │ 4.9      │
│ jsLPSolver (1.0.3)  │ 9.68 │ 1.66   │ 5.11     │
└─────────────────────┴──────┴────────┴──────────┘

SCFXM1: 330 constraints, 457 variables, 0 integers:
┌─────────────────────┬───────┬────────┬──────────┐
│ (index)             │ mean  │ stdDev │ slowdown │
├─────────────────────┼───────┼────────┼──────────┤
│ glpk.js (5.0.0)     │ 4.61  │ 0.18   │ 1        │
│ YALPS               │ 19.72 │ 0.19   │ 4.28     │
│ jsLPSolver (0.4.24) │ 27.83 │ 4.05   │ 6.04     │
│ jsLPSolver (1.0.3)  │ 29.32 │ 5.29   │ 6.36     │
└─────────────────────┴───────┴────────┴──────────┘

SCRS8: 490 constraints, 1169 variables, 0 integers:
┌─────────────────────┬───────┬────────┬──────────┐
│ (index)             │ mean  │ stdDev │ slowdown │
├─────────────────────┼───────┼────────┼──────────┤
│ glpk.js (5.0.0)     │ 14.59 │ 0.65   │ 1        │
│ YALPS               │ 53.19 │ 0.71   │ 3.65     │
│ jsLPSolver (1.0.3)  │ 76.41 │ 2.58   │ 5.24     │
│ jsLPSolver (0.4.24) │ 85.74 │ 4.68   │ 5.88     │
└─────────────────────┴───────┴────────┴──────────┘

SCTAP2: 1090 constraints, 1880 variables, 0 integers:
┌─────────────────────┬───────┬────────┬──────────┐
│ (index)             │ mean  │ stdDev │ slowdown │
├─────────────────────┼───────┼────────┼──────────┤
│ glpk.js (5.0.0)     │ 14.28 │ 0.15   │ 1        │
│ YALPS               │ 43.9  │ 2.49   │ 3.07     │
│ jsLPSolver (1.0.3)  │ 62.01 │ 2.93   │ 4.34     │
│ jsLPSolver (0.4.24) │ 78.5  │ 3.6    │ 5.5      │
└─────────────────────┴───────┴────────┴──────────┘

SHIP08S: 778 constraints, 2387 variables, 0 integers:
┌─────────────────────┬───────┬────────┬──────────┐
│ (index)             │ mean  │ stdDev │ slowdown │
├─────────────────────┼───────┼────────┼──────────┤
│ glpk.js (5.0.0)     │ 8.79  │ 0.22   │ 1        │
│ YALPS               │ 14.92 │ 2.58   │ 1.7      │
│ jsLPSolver (1.0.3)  │ 27.05 │ 3.81   │ 3.08     │
│ jsLPSolver (0.4.24) │ 43.07 │ 5.54   │ 4.9      │
└─────────────────────┴───────┴────────┴──────────┘
</pre>

The code used for these benchmarks is available under `benchmarks/`. Measuring performance isn't always straightforward, so take these synthetic benchmarks with a grain of salt. It is always recommended to benchmark for your use case. Then again, if your problems are typically of small size, then this solver should have no issue (and may be faster)!

# Maintenance/Status

This package is still being maintained (i.e., bug fixes and security updates as necessary). However, no new features are planned or being worked on at this time.
