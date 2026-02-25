import { Model, Options, Solution, solve } from "../src/index.js"
import { BenchModel, Runner } from "./benchmark.js"
import jsLP, {
  ModelDefinition as JsLPModel,
  SolveResult as JsLPSolution,
  SolveOptions as JsLPOptions,
} from "javascript-lp-solver"
import jsLP_0_4, {
  IModel as JsLP_0_4_Model,
  Solution as JsLP_0_4_Solution,
  IModelOptions as JsLP_0_4_Options,
} from "javascript-lp-solver-0.4"
import GLPK, { type LP as GLPKModel, type Options as GLPKOptions, type Result as GLPKResult } from "glpk.js/node"

const glpk = await GLPK()

export const yalpsRunner: Runner<{ model: Model; options: Options }, Solution> = {
  name: "YALPS",
  convert: (model, options) => ({ model, options: { ...options, maxPivots: Infinity } }),
  solve: ({ model, options }) => solve(model, options),
  value: solution => solution.result,
}

const objectSet = (set: ReadonlySet<string> | undefined) => {
  const obj: Record<string, 1> = {}
  if (set != null) {
    for (const key of set) {
      obj[key] = 1
    }
  }
  return obj
}

const jsLPVariablesObject = (model: BenchModel) => {
  const obj: Record<string, Record<string, number>> = {}
  for (const [key, variable] of model.variables) {
    obj[key] = Object.fromEntries(variable)
  }
  return obj
}

const jsLPOptions = (options: Required<Options>) => ({
  tolerance: options.tolerance,
  timeout: options.timeout,
  exitOnCycles: options.checkCycles,
})

const jsLP_0_4_Model = (model: BenchModel, options: Required<Options>): JsLP_0_4_Model => ({
  opType: model.direction === "minimize" ? "min" : "max",
  optimize: model.objective,
  constraints: Object.fromEntries(model.constraints),
  variables: jsLPVariablesObject(model),
  ints: objectSet(model.integers),
  binaries: objectSet(model.binaries),
  options: jsLPOptions(options) satisfies JsLP_0_4_Options,
})

export const jsLPRunner_0_4: Runner<{ model: JsLP_0_4_Model; precision: number }, JsLP_0_4_Solution> = {
  name: "jsLPSolver (0.4.24)",
  convert: (model, options) => ({
    model: jsLP_0_4_Model(model, options),
    precision: options.precision,
  }),
  solve: ({ model, precision }) => jsLP_0_4.Solve(model, precision),
  value: solution => (solution.feasible ? solution.result : NaN),
}

const jsLPModel = (model: BenchModel, options: Required<Options>): JsLPModel => ({
  opType: model.direction === "minimize" ? "min" : "max",
  optimize: model.objective ?? "",
  constraints: Object.fromEntries(model.constraints),
  variables: jsLPVariablesObject(model),
  ints: objectSet(model.integers),
  binaries: objectSet(model.binaries),
  options: jsLPOptions(options) satisfies JsLPOptions,
})

export const jsLPRunner: Runner<{ model: JsLPModel; precision: number }, JsLPSolution> = {
  name: "jsLPSolver (1.0.3)",
  convert: (model, options) => ({
    model: jsLPModel(model, options),
    precision: options.precision,
  }),
  // @ts-expect-error Types are broken :/
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  solve: ({ model, precision }) => jsLP.Solve(model, precision) as JsLPSolution,
  value: solution => (solution.feasible ? solution.result : NaN),
}

const glpkModel = (model: BenchModel) => {
  const constraints = new Map<string, GLPKModel["subjectTo"][0]>()
  for (const [name, { equal, min, max }] of model.constraints) {
    // prettier-ignore
    const bnds =
      equal != null ? { type: glpk.GLP_FX, ub: 0.0, lb: equal }
      : min != null && max != null ? { type: glpk.GLP_DB, ub: max, lb: min }
      : min != null ? { type: glpk.GLP_LO, ub: 0.0, lb: min }
      : max != null ? { type: glpk.GLP_UP, ub: max, lb: 0.0 }
      : { type: glpk.GLP_FR, ub: 0.0, lb: 0.0 }

    constraints.set(name, { name, vars: [], bnds })
  }

  const objective: GLPKModel["objective"]["vars"] = []
  for (const [name, variable] of model.variables) {
    for (const [key, coef] of variable) {
      if (model.objective === key) objective.push({ name, coef })
      constraints.get(key)?.vars.push({ name, coef })
    }
  }

  return {
    name: "GLPK",
    objective: {
      direction: model.direction === "minimize" ? glpk.GLP_MIN : glpk.GLP_MAX,
      name: model.objective ?? "",
      vars: objective,
    },
    subjectTo: Array.from(constraints.values()),
    binaries: Array.from(model.binaries),
    generals: Array.from(model.integers),
  }
}

const glpkOptions = (options: Required<Options>) => ({ mipgap: options.tolerance })

export const glpkRunner: Runner<{ model: GLPKModel; options: GLPKOptions }, GLPKResult> = {
  name: "glpk.js (5.0.0)",
  convert: (model, options) => ({
    model: glpkModel(model),
    options: glpkOptions(options),
  }),
  solve: ({ model, options }) => glpk.solve(model, options),
  value: ({ result }) => ([glpk.GLP_OPT, glpk.GLP_FEAS, glpk.GLP_UNBND].includes(result.status) ? result.z : NaN),
}

export const runners: readonly Runner[] = [
  yalpsRunner as Runner,
  jsLPRunner_0_4 as Runner,
  jsLPRunner as Runner,
  glpkRunner as Runner,
]
